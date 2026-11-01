from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
ICONS_DIR = ROOT / "icons"
MASTER_PATH = ICONS_DIR / "logo_master.png"


def square_image(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    side = max(image.size)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.alpha_composite(image, ((side - image.width) // 2, (side - image.height) // 2))
    return canvas


def main() -> None:
    master = square_image(Image.open(MASTER_PATH))
    for size in (16, 32, 48, 128):
        icon = ImageOps.fit(
            master,
            (size, size),
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.5),
        )
        icon.save(ICONS_DIR / f"logo_{size}.png", optimize=True)

    favicon = ImageOps.fit(
        master,
        (128, 128),
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.5),
    )
    favicon.save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128)])


if __name__ == "__main__":
    main()
