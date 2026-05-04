import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/empty-state";
import { SectionCard } from "@/components/feedback/section-card";
import { useI18n } from "@/features/preferences/language-provider";
import { resolveAssetUrl } from "@/lib/assets";
import { propertiesService } from "@/services/properties-service";

type PropertyImage = {
  id: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  altText: string | null;
  isCover: boolean;
  orderIndex: number;
  createdAt: string;
};

type PropertyImagesPanelProps = {
  accessToken: string;
  propertyId: string;
  propertyTitle: string;
  images: PropertyImage[];
  canManage: boolean;
};

const MAX_PROPERTY_IMAGE_FILES = 10;
const MAX_PROPERTY_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_PROPERTY_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function formatMegabytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function PropertyImagesPanel({
  accessToken,
  propertyId,
  propertyTitle,
  images,
  canManage,
}: PropertyImagesPanelProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const selectedFilesSize = selectedFiles.reduce(
    (total, file) => total + file.size,
    0,
  );

  const previews = useMemo(
    () =>
      selectedFiles.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [selectedFiles],
  );

  useEffect(
    () => () => {
      previews.forEach((preview) => {
        URL.revokeObjectURL(preview.url);
      });
    },
    [previews],
  );

  const invalidateProperty = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["property-detail", propertyId],
      }),
      queryClient.invalidateQueries({ queryKey: ["properties"] }),
    ]);
  };

  const uploadMutation = useMutation({
    mutationFn: () =>
      propertiesService.uploadImages(accessToken, propertyId, selectedFiles),
    onSuccess: async () => {
      toast.success(t("propertyImages.uploadSuccess"));
      setSelectedFiles([]);
      await invalidateProperty();
    },
  });

  const coverMutation = useMutation({
    mutationFn: (imageId: string) =>
      propertiesService.updateImage(accessToken, propertyId, imageId, {
        isCover: true,
      }),
    onSuccess: async () => {
      toast.success(t("propertyImages.coverUpdated"));
      await invalidateProperty();
    },
  });

  const removeMutation = useMutation({
    mutationFn: (imageId: string) =>
      propertiesService.removeImage(accessToken, propertyId, imageId),
    onSuccess: async () => {
      toast.success(t("propertyImages.removedSuccess"));
      await invalidateProperty();
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (imageIds: string[]) =>
      propertiesService.reorderImages(accessToken, propertyId, imageIds),
    onSuccess: async () => {
      toast.success(t("propertyImages.reorderedSuccess"));
      await invalidateProperty();
    },
  });

  const moveImage = async (imageId: string, direction: "left" | "right") => {
    const currentIndex = images.findIndex((image) => image.id === imageId);

    if (currentIndex < 0) {
      return;
    }

    const nextIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;

    if (nextIndex < 0 || nextIndex >= images.length) {
      return;
    }

    const nextImages = [...images];
    const movedImage = nextImages[currentIndex];

    if (!movedImage) {
      return;
    }

    nextImages.splice(currentIndex, 1);
    nextImages.splice(nextIndex, 0, movedImage);
    await reorderMutation.mutateAsync(nextImages.map((image) => image.id));
  };

  return (
    <SectionCard
      title={t("propertyImages.title")}
      description={t("propertyImages.panelDescription", {
        property: propertyTitle,
      })}
    >
      {canManage ? (
        <div className="rounded-[26px] border border-dashed border-brand-200 bg-brand-50/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-ink-950">
                {t("propertyImages.uploadTitle")}
              </p>
              <p className="mt-1 text-sm text-ink-500">
                {t("propertyImages.uploadDescription")}
              </p>
            </div>

            <label className="secondary-button cursor-pointer">
              <ImagePlus size={18} />
              {t("propertyImages.selectPhotos")}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  const invalidFile = files.find(
                    (file) => !ACCEPTED_PROPERTY_IMAGE_TYPES.has(file.type),
                  );
                  const oversizedFile = files.find(
                    (file) => file.size > MAX_PROPERTY_IMAGE_SIZE_BYTES,
                  );

                  if (files.length > MAX_PROPERTY_IMAGE_FILES) {
                    toast.error(t("propertyImages.maxFilesError"));
                    event.target.value = "";
                    return;
                  }

                  if (invalidFile) {
                    toast.error(t("propertyImages.invalidTypeError"));
                    event.target.value = "";
                    return;
                  }

                  if (oversizedFile) {
                    toast.error(t("propertyImages.maxSizeError"));
                    event.target.value = "";
                    return;
                  }

                  setSelectedFiles(files);
                  event.target.value = "";
                }}
              />
            </label>
          </div>

          {selectedFiles.length ? (
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                {previews.map((preview) => (
                  <div
                    key={preview.url}
                    className="overflow-hidden rounded-[24px] border border-ink-200 bg-[var(--elevated-bg)]"
                  >
                    <img
                      src={preview.url}
                      alt={preview.name}
                      className="h-40 w-full object-cover"
                    />
                    <p className="truncate px-4 py-3 text-sm text-ink-600">
                      {preview.name}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-[var(--elevated-bg)] px-4 py-3 text-sm text-ink-500">
                {t("propertyImages.selectedFilesSummary", {
                  count: selectedFiles.length,
                  size: formatMegabytes(selectedFilesSize),
                })}
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedFiles([])}
                  className="secondary-button"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => void uploadMutation.mutateAsync()}
                  disabled={uploadMutation.isPending || selectedFiles.length === 0}
                  className="primary-button"
                >
                  <Upload size={16} />
                  {uploadMutation.isPending
                    ? t("propertyImages.sendingPhotos")
                    : t("propertyImages.sendPhotos")}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {images.length ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {images.map((image, index) => (
            <article
              key={image.id}
              className="overflow-hidden rounded-[28px] border border-ink-200 bg-[var(--elevated-bg)]"
            >
              <div className="relative">
                <img
                  src={resolveAssetUrl(image.fileUrl) ?? image.fileUrl}
                  alt={image.altText ?? propertyTitle}
                  className="h-52 w-full object-cover"
                />
                {image.isCover ? (
                  <span className="absolute left-3 top-3 rounded-full bg-ink-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                    {t("propertyImages.cover")}
                  </span>
                ) : null}
              </div>

              <div className="space-y-3 px-4 py-4">
                <div>
                  <p className="font-semibold text-ink-950">{image.fileName}</p>
                  <p className="mt-1 text-sm text-ink-500">
                    Ordem #{image.orderIndex + 1}
                  </p>
                </div>

                {canManage ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void coverMutation.mutateAsync(image.id)}
                      disabled={image.isCover || coverMutation.isPending}
                      className="secondary-button px-3 py-2 text-xs disabled:opacity-50"
                    >
                      <Star size={14} />
                      {t("propertyImages.makeCover")}
                    </button>
                    <button
                      type="button"
                      onClick={() => void moveImage(image.id, "left")}
                      disabled={index === 0 || reorderMutation.isPending}
                      className="secondary-button px-3 py-2 text-xs disabled:opacity-50"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void moveImage(image.id, "right")}
                      disabled={
                        index === images.length - 1 || reorderMutation.isPending
                      }
                      className="secondary-button px-3 py-2 text-xs disabled:opacity-50"
                    >
                      <ArrowRight size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeMutation.mutateAsync(image.id)}
                      disabled={removeMutation.isPending}
                      className="secondary-button px-3 py-2 text-xs text-rose-700 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      {t("propertyImages.remove")}
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5">
          <EmptyState
            title={t("propertyImages.emptyTitle")}
            description={t("propertyImages.emptyDescription")}
          />
        </div>
      )}
    </SectionCard>
  );
}
