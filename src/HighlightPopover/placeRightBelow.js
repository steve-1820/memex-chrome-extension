export const placeRightBelow = (function (_ref) {
  let gap = _ref.gap,
    frameHeight = _ref.frameHeight,
    frameWidth = _ref.frameWidth,
    frameLeft = _ref.frameLeft,
    frameTop = _ref.frameTop,
    boxHeight = _ref.boxHeight,
    selectionTop = _ref.selectionTop,
    selectionLeft = _ref.selectionLeft,
    selectionHeight = _ref.selectionHeight,
    selectionWidth = _ref.selectionWidth,
    boxWidth = _ref.boxWidth;

  let style = { position: "fixed" };

  console.log('selectionLeft', selectionLeft, '_ref', _ref)
  style.left = selectionLeft + (selectionWidth / 2) - (boxWidth)
  style.top = selectionTop + selectionHeight + gap;

  // // if the popover is placed too far to the right, align with right edge
  // if (style.right > frameWidth) {
  //   delete style.left;
  //   style.right = frameLeft + frameWidth;
  // }

  if (style.left < frameLeft) {
    style.left = frameLeft;
    // if the popover is placed beyond the right edge align with the
    // right edge of the screen
  } else if (style.left + boxWidth > frameWidth) {
    style.left = frameWidth - boxWidth;
  }

  // if the popover is placed below the frame, position above
  // selection instead if there's room
  if (style.top + boxHeight > frameHeight && selectionTop - (gap + boxHeight) > frameTop) {
    style.top = selectionTop - (gap + boxHeight);
  }

  return style;
});
