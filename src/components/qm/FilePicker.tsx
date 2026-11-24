import { useEffect, useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadError } from "@/lib/safety";
export function FilePicker({
  file,
  onChange,
  prescription = false,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  prescription?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const choose = (f?: File) => {
    if (!f) return;
    const err = uploadError(f, prescription);
    setError(err ?? "");
    if (!err) onChange(f);
    if (input.current) input.current.value = "";
  };
  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          choose(e.dataTransfer.files[0]);
        }}
        className={`flex min-h-64 flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-6 text-center ${drag ? "border-primary bg-accent" : "border-border bg-soft"}`}
      >
        <input
          ref={input}
          type="file"
          className="sr-only"
          aria-label="Upload file"
          accept={`image/jpeg,image/png,image/webp${prescription ? ",application/pdf" : ""}`}
          onChange={(e) => choose(e.target.files?.[0])}
        />
        {file ? (
          <>
            {preview ? (
              <img
                src={preview}
                alt="Your selected upload"
                className="max-h-64 max-w-full rounded-lg object-contain"
              />
            ) : (
              <FileText className="h-12 w-12 text-primary" />
            )}
            <p className="max-w-full break-all text-sm font-medium">{file.name}</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => input.current?.click()}>
                Replace {prescription ? "File" : "Image"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  onChange(null);
                  setError("");
                }}
              >
                <X className="h-4 w-4" />
                Remove
              </Button>
            </div>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-primary" />
            <p className="font-semibold">
              Drop your {prescription ? "prescription" : "medicine image"} here
            </p>
            <p className="text-sm text-muted-foreground">
              JPG, PNG, WebP{prescription ? " or PDF" : ""} · Up to 5 MB
            </p>
            <Button type="button" variant="outline" onClick={() => input.current?.click()}>
              Browse Files
            </Button>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
