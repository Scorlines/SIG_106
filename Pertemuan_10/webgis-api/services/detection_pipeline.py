"""Pipeline deteksi objek aerial/satelit: tiling YOLOv8 → koordinat geografis → GeoJSON."""

from __future__ import annotations

import io
import json
from pathlib import Path
from typing import Any, Optional

import numpy as np
from PIL import Image
from pyproj import Transformer


def _to_python(obj: Any) -> Any:
    """Rekursif: ubah semua numpy scalar ke Python native agar bisa di-JSON-serialize."""
    if isinstance(obj, dict):
        return {k: _to_python(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_to_python(v) for v in obj]
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.floating):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return _to_python(obj.tolist())
    return obj

try:
    import rasterio
    from rasterio.transform import Affine
except ImportError:
    rasterio = None
    Affine = None  # type: ignore[misc, assignment]

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None


def _iou_xyxy(box_a: np.ndarray, box_b: np.ndarray) -> float:
    x1 = max(box_a[0], box_b[0])
    y1 = max(box_a[1], box_b[1])
    x2 = min(box_a[2], box_b[2])
    y2 = min(box_a[3], box_b[3])
    inter = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    if inter <= 0:
        return 0.0
    a_a = max(1e-9, (box_a[2] - box_a[0]) * (box_a[3] - box_a[1]))
    a_b = max(1e-9, (box_b[2] - box_b[0]) * (box_b[3] - box_b[1]))
    union = a_a + a_b - inter
    return float(inter / union)


def _nms_xyxy(boxes: np.ndarray, scores: np.ndarray, iou_threshold: float = 0.45) -> list[int]:
    if len(boxes) == 0:
        return []
    order = scores.argsort()[::-1]
    keep = []
    while len(order):
        i = order[0]
        keep.append(i)
        if len(order) == 1:
            break
        rest = order[1:]
        ious = np.array([_iou_xyxy(boxes[i], boxes[j]) for j in rest])
        rest = rest[ious <= iou_threshold]
        order = rest
    return keep


def _normalize_rgb(arr: np.ndarray) -> np.ndarray:
    """(H,W) atau (H,W,3+) → uint8 RGB."""
    if arr.ndim == 2:
        arr = np.stack([arr, arr, arr], axis=-1)
    if arr.shape[2] > 3:
        arr = arr[:, :, :3]
    if arr.dtype != np.uint8:
        m, M = np.nanpercentile(arr, (2, 98))
        arr = np.clip((arr.astype(np.float64) - m) / max(M - m, 1e-9) * 255, 0, 255).astype(np.uint8)
    return np.ascontiguousarray(arr)


def _load_image(
    path_or_bytes: Path | bytes, suffix: str
) -> tuple[np.ndarray, Any | None, Optional[Any]]:
    suf = suffix.lower().lstrip(".")
    geo_ext = suf in {"tif", "tiff"}

    if geo_ext:
        if rasterio is None:
            raise RuntimeError("rasterio diperlukan untuk GeoTIFF. pip install rasterio")
        bio = io.BytesIO(path_or_bytes) if isinstance(path_or_bytes, bytes) else None
        with rasterio.open(bio if bio else Path(path_or_bytes)) as src:
            counts = []
            bands = range(1, min(src.count, 3) + 1) if src.count >= 3 else [1]
            for b in bands:
                counts.append(src.read(b))
            if src.count == 1:
                r = g = b = counts[0]
            elif src.count >= 3:
                r, g, b = counts[0], counts[1], counts[2]
            else:
                r, g = counts[0], counts[-1]
                b = counts[min(2, len(counts) - 1)]
            rgb = np.dstack([r, g, b])
            rgb = _normalize_rgb(rgb)
            tf = src.transform
            crs = src.crs
        return rgb, tf, crs

    if isinstance(path_or_bytes, Path):
        with Image.open(path_or_bytes) as im:
            arr = np.array(im.convert("RGB"))
    else:
        with Image.open(io.BytesIO(path_or_bytes)) as im:
            arr = np.array(im.convert("RGB"))
    arr = np.ascontiguousarray(arr)
    return arr, None, None


def _pixel_corners_to_lonlat_polygon(
    x1: float,
    y1: float,
    x2: float,
    y2: float,
    transform: Any | None,
    crs: Optional[Any],
    *,
    geographic_bounds: dict[str, float] | None,
    img_height: int,
    img_width: int,
) -> tuple[list[list[float]], str]:
    corners_px = [(x1, y1), (x2, y1), (x2, y2), (x1, y2)]

    if transform is None and geographic_bounds is None:
        return [], "none"

    if transform is None and geographic_bounds is not None:
        n, s, e, w = (
            geographic_bounds["north"],
            geographic_bounds["south"],
            geographic_bounds["east"],
            geographic_bounds["west"],
        )
        lonlat = []
        for px, py in corners_px:
            lon = w + (px / max(img_width - 1, 1)) * (e - w)
            lat = n - (py / max(img_height - 1, 1)) * (n - s)
            lonlat.append([lon, lat])
        lonlat.append(lonlat[0])
        return lonlat, "geo"

    if transform is None:
        return [], "none"

    transformer = Transformer.from_crs(crs, "EPSG:4326", always_xy=True) if crs else None
    lonlat = []
    for cx, cy in corners_px:
        wx, wy = (transform * (cx, cy))
        if transformer is not None:
            lo, la = transformer.transform(wx, wy)
            lonlat.append([float(lo), float(la)])
        else:
            lonlat.append([float(wx), float(wy)])
    lonlat.append(lonlat[0])
    return lonlat, "geo"


def _iter_tile_offsets(h: int, w: int, tile: int, overlap: int):
    step = max(1, tile - overlap)
    y = 0
    while y < h:
        x = 0
        while x < w:
            y2 = min(y + tile, h)
            x2 = min(x + tile, w)
            yield y, x, y2 - y, x2 - x
            x += step
        y += step


def run_detection(
    *,
    image_path: Path | None = None,
    image_bytes: bytes | None = None,
    suffix: str = ".png",
    model_name: str = "yolov8n.pt",
    tile_imgsize: int = 640,
    overlap: int = 128,
    conf: float = 0.25,
    iou_nms: float = 0.45,
    geographic_bounds: dict[str, float] | None = None,
) -> dict[str, Any]:
    if YOLO is None:
        raise RuntimeError("ultralytics belum terpasang. pip install ultralytics")

    if image_path:
        suffix = image_path.suffix or suffix
        rgb, tf, crs = _load_image(image_path, suffix)
    elif image_bytes is not None:
        rgb, tf, crs = _load_image(image_bytes, suffix)
    else:
        raise ValueError("Berikan image_path atau image_bytes")

    H, W = rgb.shape[:2]
    tf = Affine(*tf[:6]) if tf is not None and Affine else None

    if tf is not None and crs is None:
        raise ValueError(
            "GeoTIFF tidak memiliki informasi CRS. Tetapkan CRS pada file atau konversikan ke EPSG yang valid."
        )

    if tf is None and geographic_bounds is None:
        raise ValueError(
            "Citra non-GeoTIFF membutuhkan bounds geografis (north, south, east, west) "
            "untuk konversi bounding box ke peta WebGIS."
        )

    model = YOLO(model_name)
    all_boxes = []
    all_scores = []
    all_cls = []
    names: dict[int, str] = {}

    for oy, ox, th, tw in _iter_tile_offsets(H, W, tile_imgsize, overlap):
        tile = np.zeros((tile_imgsize, tile_imgsize, 3), dtype=np.uint8)
        slice_h = th
        slice_w = tw
        tile[:slice_h, :slice_w] = rgb[oy : oy + th, ox : ox + tw]
        pred = model.predict(tile, imgsz=tile_imgsize, verbose=False, conf=conf)[0]
        names = dict(pred.names)

        if pred.boxes is None or len(pred.boxes) == 0:
            continue
        xy = pred.boxes.xyxy.cpu().numpy()
        sc = pred.boxes.conf.cpu().numpy()
        cls = pred.boxes.cls.cpu().numpy().astype(int)

        for i in range(len(xy)):
            bx1, by1, bx2, by2 = xy[i]
            if bx2 <= 0 or by2 <= 0 or bx1 >= slice_w or by1 >= slice_h:
                continue
            gx1 = max(0, bx1) + ox
            gy1 = max(0, by1) + oy
            gx2 = min(slice_w, bx2) + ox
            gy2 = min(slice_h, by2) + oy

            gx1 = float(np.clip(gx1, 0, W))
            gx2 = float(np.clip(gx2, 0, W))
            gy1 = float(np.clip(gy1, 0, H))
            gy2 = float(np.clip(gy2, 0, H))

            if gx2 - gx1 < 2 or gy2 - gy1 < 2:
                continue

            all_boxes.append([gx1, gy1, gx2, gy2])
            all_scores.append(float(sc[i]))
            all_cls.append(int(cls[i]))

    geo_capable = bool(tf or geographic_bounds)
    if not all_boxes:
        return {
            "type": "FeatureCollection",
            "features": [],
            "properties": {
                "count": 0,
                "image_size": {"width": int(W), "height": int(H)},
                "geo_mode": "geo" if geo_capable else "none",
                "model": str(model_name),
            },
        }

    boxes = np.array(all_boxes, dtype=np.float32)
    scores_arr = np.array(all_scores)
    cls_arr = np.array(all_cls)

    keep = _nms_xyxy(boxes, scores_arr, iou_threshold=iou_nms)
    boxes = boxes[keep]
    scores_arr = scores_arr[keep]
    cls_arr = cls_arr[keep]

    features = []
    for i in range(len(boxes)):
        x1, y1, x2, y2 = boxes[i]
        ring, mode = _pixel_corners_to_lonlat_polygon(
            x1,
            y1,
            x2,
            y2,
            tf,
            crs if crs else None,
            geographic_bounds=geographic_bounds,
            img_height=H,
            img_width=W,
        )
        cid = int(cls_arr[i])
        lbl = names.get(cid, str(cid))

        geom = {"type": "Polygon", "coordinates": [ring]} if mode == "geo" and ring else None
        feats: dict[str, Any] = {
            "confidence": float(scores_arr[i]),  # cast numpy.float32 → Python float
            "class_id": cid,
            "class_name": lbl,
            "pixel_bbox": {"x_min": float(x1), "y_min": float(y1), "x_max": float(x2), "y_max": float(y2)},
        }
        if geom is None:
            feats["_note"] = "Georef tidak lengkap untuk fitur ini"
        features.append(
            {
                "type": "Feature",
                "geometry": geom,
                "properties": feats,
            }
        )

    has_geom_any = bool(features and features[0].get("geometry"))
    fc = {
        "type": "FeatureCollection",
        "features": features,
        "properties": {
            "count": int(len(features)),
            "model": str(model_name),
            "image_size": {"width": int(W), "height": int(H)},
            "tile_imgsize": int(tile_imgsize),
            "overlap_px": int(overlap),
            "confidence_threshold": float(conf),
            "geo_mode": "geo" if has_geom_any else "none",
        },
    }
    return _to_python(fc)  # pastikan semua numpy scalar sudah dikonversi


def save_geojson(fc: dict[str, Any], out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fc = fix_featurecollection_meta(fc)
    out_path.write_text(json.dumps(fc, indent=2, ensure_ascii=False), encoding="utf-8")


def fix_featurecollection_meta(fc: dict[str, Any]) -> dict[str, Any]:
    fc = dict(fc)
    feats = fc.get("features", [])
    has_geom = bool(feats and feats[0].get("geometry"))
    props = dict(fc.get("properties") or {})
    props["geo_mode"] = "geo" if has_geom else "none"
    fc["properties"] = props
    return fc
