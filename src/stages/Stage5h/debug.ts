interface TrapezoidClip {
  leftX: number;
  rightX: number;
  // Для левого края
  leftTopY: number;
  leftBottomY: number;
  // Для правого края
  rightTopY: number;
  rightBottomY: number;
}

export function drawPortalOutline(
  ctx: CanvasRenderingContext2D, 
  clip: TrapezoidClip, 
  color: string = '#FF0000',
  lineWidth: number = 2
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash([5, 5]); // Пунктирная линия для наглядности
  
  ctx.beginPath();
  
  // Рисуем трапецию портала
  // Верхняя грань
  ctx.moveTo(clip.leftX, clip.leftTopY);
  ctx.lineTo(clip.rightX, clip.rightTopY);
  
  // Правая грань
  ctx.lineTo(clip.rightX, clip.rightBottomY);
  
  // Нижняя грань
  ctx.lineTo(clip.leftX, clip.leftBottomY);
  
  // Левая грань
  ctx.closePath();
  
  ctx.stroke();
  
  // Опционально: заливаем полупрозрачным цветом для наглядности
  ctx.fillStyle = color + '20'; // 20 = прозрачность в hex (примерно 12%)
  ctx.fill();
  
  // Рисуем дополнительные маркеры на углах
  const markerSize = 5;
  ctx.fillStyle = color;
  ctx.setLineDash([]);
  
  // Левый верхний угол
  ctx.fillRect(clip.leftX - markerSize/2, clip.leftTopY - markerSize/2, markerSize, markerSize);
  // Правый верхний угол
  ctx.fillRect(clip.rightX - markerSize/2, clip.rightTopY - markerSize/2, markerSize, markerSize);
  // Левый нижний угол
  ctx.fillRect(clip.leftX - markerSize/2, clip.leftBottomY - markerSize/2, markerSize, markerSize);
  // Правый нижний угол
  ctx.fillRect(clip.rightX - markerSize/2, clip.rightBottomY - markerSize/2, markerSize, markerSize);
  
  // Рисуем центральную линию (опционально)
  ctx.beginPath();
  const centerX = (clip.leftX + clip.rightX) / 2;
  const centerTopY = (clip.leftTopY + clip.rightTopY) / 2;
  const centerBottomY = (clip.leftBottomY + clip.rightBottomY) / 2;
  
  ctx.moveTo(centerX, centerTopY);
  ctx.lineTo(centerX, centerBottomY);
  ctx.strokeStyle = color;
  ctx.stroke();
  
  ctx.restore();
}