import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { cropImageToAvatarDataUrl } from "@/lib/profile-avatar";
import { UI } from "@/lib/translations";
import { useCallback, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";

type ProfileAvatarCropDialogProps = {
  open: boolean;
  imageSrc: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (dataUrl: string) => void;
};

export function ProfileAvatarCropDialog({
  open,
  imageSrc,
  onOpenChange,
  onConfirm,
}: ProfileAvatarCropDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setIsSaving(false);
    }
    onOpenChange(nextOpen);
  };

  const handleSave = () => {
    if (!imageSrc || !croppedAreaPixels || isSaving) return;
    void (async () => {
      setIsSaving(true);
      try {
        const dataUrl = await cropImageToAvatarDataUrl(
          imageSrc,
          croppedAreaPixels,
        );
        onConfirm(dataUrl);
        handleOpenChange(false);
      } catch {
        setIsSaving(false);
      }
    })();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-3 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{UI.profileCropPhoto}</DialogTitle>
        </DialogHeader>

        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          ) : null}
        </div>

        <div className="flex items-center gap-3 px-1">
          <span className="shrink-0 text-xs text-muted-foreground">
            {UI.profileCropZoom}
          </span>
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.05}
            onValueChange={([value]) => setZoom(value ?? 1)}
            aria-label={UI.profileCropZoom}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {UI.cancel}
          </Button>
          <Button onClick={handleSave} disabled={!croppedAreaPixels || isSaving}>
            {UI.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
