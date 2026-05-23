#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os

sizes = [72, 96, 128, 144, 152, 192, 384, 512]

def generate_icon(size):
    # Create image with green gradient background
    img = Image.new('RGB', (size, size), color='#16a34a')
    draw = ImageDraw.Draw(img)
    
    # Draw gradient effect (simple two-color)
    for y in range(size):
        # Interpolate between two greens
        ratio = y / size
        r = int(22 * (1 - ratio) + 21 * ratio)
        g = int(163 * (1 - ratio) + 128 * ratio)
        b = int(74 * (1 - ratio) + 61 * ratio)
        draw.line([(0, y), (size, y)], fill=(r, g, b))
    
    # Draw text
    try:
        # Try to use a bold font
        font_size_best = int(size * 0.22)
        font_size_old = int(size * 0.25)
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size_best)
        font2 = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size_old)
    except:
        font = ImageFont.load_default()
        font2 = ImageFont.load_default()
    
    # Draw BEST
    text1 = "BEST"
    bbox1 = draw.textbbox((0, 0), text1, font=font)
    text_width1 = bbox1[2] - bbox1[0]
    text_height1 = bbox1[3] - bbox1[1]
    x1 = (size - text_width1) // 2
    y1 = int(size * 0.38) - text_height1 // 2
    draw.text((x1, y1), text1, fill='white', font=font)
    
    # Draw OLD
    text2 = "OLD"
    bbox2 = draw.textbbox((0, 0), text2, font=font2)
    text_width2 = bbox2[2] - bbox2[0]
    text_height2 = bbox2[3] - bbox2[1]
    x2 = (size - text_width2) // 2
    y2 = int(size * 0.62) - text_height2 // 2
    draw.text((x2, y2), text2, fill='white', font=font2)
    
    # Draw shopping bag icon
    bag_size = int(size * 0.12)
    bag_x = size // 2
    bag_y = int(size * 0.82)
    line_width = max(2, int(size * 0.025))
    
    # Bag body (trapezoid)
    bag_points = [
        (bag_x - bag_size, bag_y - bag_size // 2),
        (bag_x - int(bag_size * 0.8), bag_y + bag_size),
        (bag_x + int(bag_size * 0.8), bag_y + bag_size),
        (bag_x + bag_size, bag_y - bag_size // 2),
        (bag_x - bag_size, bag_y - bag_size // 2)
    ]
    draw.line(bag_points, fill='white', width=line_width)
    
    # Bag handle (arc)
    handle_bbox = [
        bag_x - int(bag_size * 0.6),
        bag_y - bag_size // 2 - int(bag_size * 1.2),
        bag_x + int(bag_size * 0.6),
        bag_y - bag_size // 2 + int(bag_size * 0.6)
    ]
    draw.arc(handle_bbox, start=180, end=0, fill='white', width=line_width)
    
    # Save
    output_path = f'public/icon-{size}x{size}.png'
    img.save(output_path, 'PNG')
    print(f'✓ Generated {output_path}')

def main():
    print('🎨 Generating BESTOLD app icons...\n')
    
    for size in sizes:
        generate_icon(size)
    
    # Generate favicon
    generate_icon(32)
    os.rename('public/icon-32x32.png', 'public/favicon.png')
    print('✓ Generated favicon.png')
    
    print('\n✅ All icons generated successfully!')

if __name__ == '__main__':
    main()
