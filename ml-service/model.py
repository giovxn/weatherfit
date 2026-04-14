import json
import os
from typing import Dict, List, Tuple

import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms

IMG_SIZE = 128
MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]

DEFAULT_LABELS = {
    "category": ["Accessories", "Bottom", "Hat", "Shoes", "Top"],
    "warmth": ["Fall", "Spring", "Summer", "Winter"],
    "formality": ["Casual", "Ethnic", "Formal", "Sports"],
}


class ClothingAttributeModel(nn.Module):
    def __init__(self, num_categories: int, num_warmth: int, num_formality: int):
        super().__init__()
        backbone = models.resnet50(weights=None)
        self.backbone = nn.Sequential(*list(backbone.children())[:-1])
        self.shared_fc = nn.Sequential(
            nn.Flatten(),
            nn.Linear(2048, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
        )
        self.head_category = nn.Linear(512, num_categories)
        self.head_warmth = nn.Linear(512, num_warmth)
        self.head_formality = nn.Linear(512, num_formality)

    def forward(self, x):
        x = self.backbone(x)
        x = self.shared_fc(x)
        return self.head_category(x), self.head_warmth(x), self.head_formality(x)


def load_labels() -> Dict[str, List[str]]:
    labels_path = os.getenv("ML_LABELS_PATH", "label_maps.json")
    if os.path.exists(labels_path):
        with open(labels_path, "r", encoding="utf-8") as f:
            labels = json.load(f)
        return {
            "category": labels["category"],
            "warmth": labels["warmth"],
            "formality": labels["formality"],
        }
    return DEFAULT_LABELS


def infer_head_sizes(state_dict: Dict[str, torch.Tensor]) -> Dict[str, int]:
    return {
        "category": state_dict["head_category.weight"].shape[0],
        "warmth": state_dict["head_warmth.weight"].shape[0],
        "formality": state_dict["head_formality.weight"].shape[0],
    }


def align_labels_with_heads(
    labels: Dict[str, List[str]], expected_sizes: Dict[str, int]
) -> Dict[str, List[str]]:
    aligned = {}
    for key in ["category", "warmth", "formality"]:
        values = labels.get(key, [])
        expected = expected_sizes[key]
        if len(values) < expected:
            values = values + [f"{key}_{i}" for i in range(len(values), expected)]
        elif len(values) > expected:
            values = values[:expected]
        aligned[key] = values
    return aligned


def get_device() -> torch.device:
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


class Predictor:
    def __init__(self):
        self.device = get_device()
        labels = load_labels()

        ckpt_path = os.getenv("ML_MODEL_PATH", "best_model.pth")
        if not os.path.exists(ckpt_path):
            raise FileNotFoundError(
                f"Model checkpoint not found: {ckpt_path}. "
                "Set ML_MODEL_PATH to your .pth file."
            )

        state = torch.load(ckpt_path, map_location=self.device)
        head_sizes = infer_head_sizes(state)
        self.labels = align_labels_with_heads(labels, head_sizes)

        self.model = ClothingAttributeModel(
            num_categories=len(self.labels["category"]),
            num_warmth=len(self.labels["warmth"]),
            num_formality=len(self.labels["formality"]),
        ).to(self.device)
        self.model.load_state_dict(state)
        self.model.eval()

        self.tf = transforms.Compose(
            [
                transforms.Resize((IMG_SIZE, IMG_SIZE)),
                transforms.ToTensor(),
                transforms.Normalize(MEAN, STD),
            ]
        )

    def _decode(self, logits: torch.Tensor, labels: List[str]) -> Tuple[str, float]:
        probs = torch.softmax(logits, dim=1)
        conf, idx = torch.max(probs, dim=1)
        return labels[idx.item()], conf.item()

    def _map_to_weatherfit(self, category: str, warmth: str, formality: str) -> Dict:
        category_map = {
            "Top": "top",
            "Bottom": "bottom",
            "Shoes": "shoes",
            "Accessories": "accessories",
            "Hat": "hat",
        }
        warmth_map = {"Summer": 2, "Spring": 4, "Fall": 6, "Winter": 9}
        formality_map = {
            "Casual": ["casual"],
            "Ethnic": ["formal"],
            "Formal": ["formal"],
            "Sports": ["casual"],
        }

        mapped_category = category_map.get(category, "top")
        mapped_warmth = warmth_map.get(warmth, 5)
        mapped_formality = formality_map.get(formality, ["casual"])

        if mapped_category == "top" and mapped_warmth >= 8:
            mapped_category = "outerwear"

        return {
            "category": mapped_category,
            "warmthRating": mapped_warmth,
            "formalities": mapped_formality,
        }

    @torch.no_grad()
    def predict(self, image: Image.Image) -> Dict:
        tensor = self.tf(image).unsqueeze(0).to(self.device)
        out_cat, out_warmth, out_formality = self.model(tensor)

        pred_cat, conf_cat = self._decode(out_cat, self.labels["category"])
        pred_warmth, conf_warmth = self._decode(out_warmth, self.labels["warmth"])
        pred_formality, conf_formality = self._decode(
            out_formality, self.labels["formality"]
        )

        confidence = round(((conf_cat + conf_warmth + conf_formality) / 3) * 100)

        return {
            "raw": {
                "category": pred_cat,
                "warmth": pred_warmth,
                "formality": pred_formality,
            },
            "mapped": self._map_to_weatherfit(pred_cat, pred_warmth, pred_formality),
            "confidence": confidence,
            "confidenceByHead": {
                "category": round(conf_cat * 100, 2),
                "warmth": round(conf_warmth * 100, 2),
                "formality": round(conf_formality * 100, 2),
            },
        }
