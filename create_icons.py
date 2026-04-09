from PIL import Image, ImageDraw, ImageFont
import os

# Navy color
NAVY = (30, 58, 138)  # #1e3a8a

def create_icon(size, filename):
    # Create image with navy background
    img = Image.new('RGBA', (size, size), NAVY + (255,))
    draw = ImageDraw.Draw(img)
    
    # Try to use a font that supports emoji
    try:
        # Try common emoji fonts
        font_paths = [
            '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf',
            '/usr/share/fonts/truetype/ancient-scripts/Symbola605.ttf',
            '/System/Library/Fonts/Apple Color Emoji.ttc',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        ]
        font = None
        for font_path in font_paths:
            if os.path.exists(font_path):
                try:
                    font = ImageFont.truetype(font_path, int(size * 0.6))
                    break
                except:
                    continue
        
        if font is None:
            font = ImageFont.load_default()
        
        # Draw bear emoji
        text = "🐻"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = (size - text_width) // 2 - bbox[0]
        y = (size - text_height) // 2 - bbox[1]
        
        draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))
    except Exception as e:
        print(f"Could not add emoji: {e}")
        # Fallback: draw a white circle as placeholder
        margin = size // 4
        draw.ellipse([margin, margin, size - margin, size - margin], 
                     fill=(255, 255, 255, 255))
    
    # Add rounded corners
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    radius = int(size * 0.15)
    mask_draw.rounded_rectangle([(0, 0), (size, size)], radius=radius, fill=255)
    
    # Apply mask
    output = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    output.paste(img, (0, 0))
    output.putalpha(mask)
    
    # Save
    output.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

# Create icons
public_dir = '/home/kuma/Downloads/calendar-todo-app/public'
create_icon(192, os.path.join(public_dir, 'icon-192.png'))
create_icon(512, os.path.join(public_dir, 'icon-512.png'))

print("✓ PNG icons created successfully")
