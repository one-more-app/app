import {
    SESSION_RECAP_SHARE_WIDTH,
    SESSION_RECAP_STICKER_WIDTH,
    SessionRecapShareCard,
    type SessionRecapShareMode,
    type SessionRecapSharePayload,
    type SessionRecapShareVariant,
} from "@/components/share/SessionRecapShareCard";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
    isRecapVariantAvailable,
    RECAP_SHARE_VARIANTS,
} from "@/lib/session-recap-share-data";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Camera, Download, Instagram, Layers2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const TAB_LABEL: Record<SessionRecapShareVariant, string> = {
    stats: UI.recapStoryTabStats,
    muscles: UI.recapStoryTabMuscles,
    records: UI.recapStoryTabRecords,
};

const MODE_ITEMS = [
    { id: "photo" as const, label: UI.recapStoryModePhoto, Icon: Camera },
    { id: "sticker" as const, label: UI.recapStoryModeSticker, Icon: Layers2 },
];

const CHECKERBOARD =
    "repeating-conic-gradient(#d4d4d8 0% 25%, #f4f4f5 0% 50%) 50% / 24px 24px";

function useElementWidth<T extends HTMLElement>() {
    const ref = useRef<T | null>(null);
    const [width, setWidth] = useState(0);
    const setRef = useCallback((node: T | null) => {
        ref.current = node;
        if (node) setWidth(node.clientWidth);
    }, []);
    useEffect(() => {
        const node = ref.current;
        if (!node || typeof ResizeObserver === "undefined") return;
        const observer = new ResizeObserver(() => setWidth(node.clientWidth));
        observer.observe(node);
        return () => observer.disconnect();
    });
    return [setRef, width] as const;
}

type RecapShareDrawerProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    payload: SessionRecapSharePayload;
    initialVariant: SessionRecapShareVariant;
};

/** Tiroir « Partager en story » du récap (capture 42). */
export function RecapShareDrawer({
    open,
    onOpenChange,
    payload,
    initialVariant,
}: RecapShareDrawerProps) {
    const [variant, setVariant] =
        useState<SessionRecapShareVariant>(initialVariant);
    const [mode, setMode] = useState<SessionRecapShareMode>("photo");
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [busy, setBusy] = useState<"save" | "share" | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [previewRef, previewWidth] = useElementWidth<HTMLDivElement>();

    useEffect(() => {
        if (open) setVariant(initialVariant);
    }, [open, initialVariant]);

    const cardWidth =
        mode === "sticker" ? SESSION_RECAP_STICKER_WIDTH : SESSION_RECAP_SHARE_WIDTH;
    const scale = previewWidth > 0 ? previewWidth / SESSION_RECAP_SHARE_WIDTH : 0;

    const handlePhoto = async (file: File | undefined) => {
        if (!file) return;
        try {
            const { readSharePhoto } = await import("@/lib/session-recap-share");
            setPhotoUrl(await readSharePhoto(file));
        } catch {
            toast.error(UI.recapStoryPhotoError);
        }
    };

    const run = async (kind: "save" | "share") => {
        if (busy) return;
        setBusy(kind);
        try {
            const lib = await import("@/lib/session-recap-share");
            const options = { payload, variant, mode, photoUrl };
            const result =
                kind === "share"
                    ? await lib.shareSessionRecapPng(options)
                    : await lib.saveSessionRecapPng(options);
            if (result === "downloaded") toast.success(UI.shareImageSaved);
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") return;
            toast.error(UI.shareImageError);
        } finally {
            setBusy(null);
        }
    };

    return (
        <Drawer
            open={open}
            onOpenChange={onOpenChange}
            data-analytics-label="recap_share_drawer"
        >
            <DrawerContent data-openpanel-replay-block className="max-h-[92dvh]">
                <DrawerHeader className="pb-2 pt-1">
                    <DrawerTitle className="font-one-more text-sm uppercase italic">
                        {UI.recapStoryTitle}
                    </DrawerTitle>
                </DrawerHeader>

                <div className="flex min-h-0 flex-col items-center gap-4 overflow-y-auto px-4 pb-4">
                    <div
                        ref={previewRef}
                        role="img"
                        aria-label={UI.recapStoryPreviewAria}
                        className="relative aspect-[9/16] shrink-0 overflow-hidden rounded-3xl bg-black"
                        style={{
                            width:
                                "clamp(140px, min(52vw, calc((92dvh - 23rem) * 9 / 16)), 240px)",
                            background: mode === "sticker" ? CHECKERBOARD : undefined,
                        }}
                    >
                        {scale > 0 ? (
                            <div
                                className="pointer-events-none absolute left-1/2 top-1/2"
                                style={{
                                    width: cardWidth,
                                    transform: `translate(-50%, -50%) scale(${scale})`,
                                    transformOrigin: "center",
                                }}
                            >
                                <SessionRecapShareCard
                                    payload={payload}
                                    variant={variant}
                                    mode={mode}
                                    photoUrl={photoUrl}
                                />
                            </div>
                        ) : null}
                        {mode === "photo" ? (
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className={cn(
                                    "absolute shadow-md",
                                    photoUrl
                                        ? "right-2 top-2"
                                        : "left-1/2 top-[30%] -translate-x-1/2",
                                )}
                                onClick={() => fileInputRef.current?.click()}
                                data-analytics-label="recap_share_pick_photo"
                            >
                                <Camera className="size-4" aria-hidden />
                                {photoUrl ? UI.recapStoryChangePhoto : UI.recapStoryPickPhoto}
                            </Button>
                        ) : null}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => {
                                void handlePhoto(event.target.files?.[0]);
                                event.target.value = "";
                            }}
                        />
                    </div>

                    <ToggleGroup
                        type="single"
                        value={variant}
                        onValueChange={(next) => {
                            if (next) setVariant(next as SessionRecapShareVariant);
                        }}
                        spacing={2}
                        aria-label={UI.recapStoryTabsAria}
                        className="w-full flex-wrap justify-center"
                    >
                        {RECAP_SHARE_VARIANTS.map((item) => (
                            <ToggleGroupItem
                                key={item}
                                value={item}
                                disabled={!isRecapVariantAvailable(payload, item)}
                                className="rounded-full font-one-more text-[11px] font-bold uppercase italic"
                            >
                                {TAB_LABEL[item]}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>

                    <SegmentedToggle
                        value={mode}
                        onChange={setMode}
                        items={MODE_ITEMS}
                        ariaLabel={UI.recapStoryModesAria}
                        className="w-full"
                    />

                    <div className="flex w-full gap-3">
                        <Button
                            type="button"
                            className="bg-card"
                            variant="secondary"
                            disabled={busy !== null}
                            onClick={() => void run("save")}
                            data-analytics-label="recap_share_save"
                        >
                            <Download className="size-4" aria-hidden />
                            {busy === "save" ? UI.sharePreparing : UI.recapStorySave}
                        </Button>
                        <Button
                            type="button"
                            variant="accent"
                            className="flex-1"
                            disabled={busy !== null}
                            onClick={() => void run("share")}
                            data-analytics-label="recap_share_story"
                        >
                            <Instagram className="size-4" aria-hidden />
                            {busy === "share" ? UI.sharePreparing : UI.recapStoryShare}
                        </Button>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
