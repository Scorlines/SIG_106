import json
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from services.detection_pipeline import fix_featurecollection_meta, run_detection, save_geojson

router = APIRouter(prefix="/api/detection", tags=["Deteksi YOLO"])

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "detections"
LATEST_GEOJSON = DATA_DIR / "latest.geojson"


def _bounds_from_form(
    n: float | None, s: float | None, e: float | None, w: float | None
) -> dict[str, float] | None:
    if n is None and s is None and e is None and w is None:
        return None
    if None in (n, s, e, w):
        raise HTTPException(
            status_code=422,
            detail="Bounds geografis tidak lengkap. Isi north, south, east, dan west secara bersamaan.",
        )
    if not (-90 <= n <= 90 and -90 <= s <= 90):
        raise HTTPException(status_code=422, detail="Latitude north/south di luar [-90, 90].")
    if float(n) <= float(s):
        raise HTTPException(status_code=422, detail="north harus lebih besar dari south untuk extent standar.")
    if not (-180 <= e <= 180 and -180 <= w <= 180):
        raise HTTPException(status_code=422, detail="Longitude east/west di luar [-180, 180].")
    return {"north": float(n), "south": float(s), "east": float(e), "west": float(w)}


@router.post("/run")
async def detection_run(
    file: UploadFile = File(..., description="Citra JPG/PNG atau GeoTIFF georeferensi"),
    tile_size: int = Form(640),
    overlap: int = Form(128),
    conf: float = Form(0.25),
    iou_nms: float = Form(0.45),
    model_name: str = Form("yolov8n.pt"),
    bbox_north: float | None = Form(None),
    bbox_south: float | None = Form(None),
    bbox_east: float | None = Form(None),
    bbox_west: float | None = Form(None),
):
    """
    Menjalankan YOLOv8 dengan tiling, mengonversi bounding box ke geografis jika CRS/bounds ada,
    lalu menyimpan GeoJSON untuk WebGIS (`data/detections/latest.geojson`).
    """
    tile_size = max(320, min(tile_size, 1280))
    overlap = max(0, min(overlap, tile_size // 2))
    suf = Path(file.filename or "upload.png").suffix or ".png"

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="File kosong.")

    bounds = _bounds_from_form(bbox_north, bbox_south, bbox_east, bbox_west)

    tmp_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suf) as tmp:
            tmp.write(raw)
            tmp_path = Path(tmp.name)
        fc = run_detection(
            image_path=tmp_path,
            suffix=suf,
            model_name=model_name,
            tile_imgsize=tile_size,
            overlap=overlap,
            conf=conf,
            iou_nms=iou_nms,
            geographic_bounds=bounds,
        )
        fc = fix_featurecollection_meta(fc)
        save_geojson(fc, LATEST_GEOJSON)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pemrosesan gagal: {str(e)}")
    finally:
        if tmp_path is not None and tmp_path.exists():
            tmp_path.unlink()

    meta = fc.get("properties", {})
    return {
        "ok": True,
        "saved_geojson_url": "/api/detection/geojson",
        "count": meta.get("count", 0),
        "geo_mode": meta.get("geo_mode"),
        "message": (
            "Deteksi selesai. Muat GeoJSON dari /api/detection/geojson atau refresh layer di WebGIS."
        ),
    }


@router.get("/geojson")
async def detection_geojson():
    if not LATEST_GEOJSON.is_file():
        return fix_featurecollection_meta(
            {"type": "FeatureCollection", "features": [], "properties": {"count": 0, "geo_mode": "none"}}
        )
    fc = json.loads(LATEST_GEOJSON.read_text(encoding="utf-8"))
    return fix_featurecollection_meta(fc)
