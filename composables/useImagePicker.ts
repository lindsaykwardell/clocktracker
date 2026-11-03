/**
 * Cross-platform image picker.
 * On Capacitor: uses @capacitor/camera for camera or gallery.
 * On web: falls back to a file input.
 */
export function useImagePicker() {
  const config = useRuntimeConfig();
  const isCapacitor = config.public.isCapacitorBuild;

  /**
   * Pick one or more images. Returns an array of Files ready for FormData.
   */
  async function pickImages(options?: {
    multiple?: boolean;
  }): Promise<File[]> {
    if (isCapacitor) {
      return pickFromCamera();
    }
    return pickFromFileInput(options?.multiple ?? false);
  }

  async function pickFromCamera(): Promise<File[]> {
    const { Camera, CameraResultType, CameraSource } = await import(
      "@capacitor/camera"
    );

    const photo = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt, // Lets user choose camera or gallery
      width: 1200,
      height: 1200,
    });

    if (!photo.webPath) return [];

    const response = await fetch(photo.webPath);
    const blob = await response.blob();
    const extension = photo.format || "jpeg";
    const file = new File([blob], `photo.${extension}`, {
      type: `image/${extension}`,
    });

    return [file];
  }

  function pickFromFileInput(multiple: boolean): Promise<File[]> {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/jpg, image/jpeg, image/png";
      input.multiple = multiple;
      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const files = target.files ? Array.from(target.files) : [];
        resolve(files);
      };
      // Handle cancel
      input.addEventListener("cancel", () => resolve([]));
      input.click();
    });
  }

  return { pickImages };
}
