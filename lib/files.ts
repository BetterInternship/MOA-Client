/**
 * Helps us download a generated JSON in the browser.
 *
 * @param filename
 * @param data
 */
export const downloadJSON = (filename: string, data: any) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
};

/**
 * Returns a file object of the pdf, given the url.
 *
 * @param url
 * @param filename
 * @returns
 */
export const loadPdfAsFile = async (url: string, filename: string): Promise<File> => {
  const response = await fetch(url, {});
  if (!response.ok) {
    throw new Error(`Network response was not ok: ${response.statusText}`);
  }

  const blob = await response.blob(); // get binary data
  const file = new File([blob], filename, { type: blob.type }); // wrap in File
  return file;
};
