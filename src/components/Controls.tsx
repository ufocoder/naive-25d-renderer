interface KeyboardControlsProps {
  withVertical?: boolean;
}

export default function KeyboardControls({ withVertical }: KeyboardControlsProps) {
  return (
    <>
    <p class="font-normal text-gray-500 py-2">
      Camera horizontal controls:{" "}
      <kbd class="p-1.5 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-400 rounded">
        W
      </kbd>{" "}
      <kbd class="p-1.5 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-400 rounded">
        A
      </kbd>{" "}
      <kbd class="p-1.5 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-400 rounded">
        S
      </kbd>{" "}
      <kbd class="p-1.5 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-400 rounded">
        D
      </kbd>{" "}
      {withVertical && (
        <p class="font-normal text-gray-500 py-2">
          Camera vertical controls:{" "}
          <kbd class="p-1.5 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-400 rounded">
            Z
          </kbd>{" "}
          <kbd class="p-1.5 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-400 rounded">
            X
          </kbd>{" "}
        </p>
      )}
    </p>
    </>
  );
}
