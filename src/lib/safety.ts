export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export function uploadError(file: { type: string; size: number }, prescription = false) {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    ...(prescription ? ["application/pdf"] : []),
  ];
  if (!allowed.includes(file.type))
    return "Choose a JPG, PNG or WebP image" + (prescription ? ", or a PDF." : ".");
  if (file.size > MAX_UPLOAD_BYTES) return "File must be 5 MB or smaller.";
  if (file.size === 0) return "The file is empty. Choose another file.";
  return null;
}
export function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function bookingError(
  date: string,
  time: string,
  patient: string,
  phone: string,
  slots: string[],
) {
  if (!date || !time || !slots.includes(time)) return "Choose an available date and time.";
  const when = new Date(`${date}T${time}:00`);
  if (!Number.isFinite(when.getTime()) || when.getTime() <= Date.now())
    return "Choose a future appointment.";
  if (patient.trim().length < 2) return "Enter the patient’s full name.";
  if (!/^[6-9]\d{9}$/.test(phone)) return "Enter a valid 10-digit mobile number.";
  return null;
}
