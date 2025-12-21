export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/png;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to read file as string"));
      }
    };
    reader.onerror = error => reject(error);
  });
};

export const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};

export const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Delay revocation to ensure download starts on mobile devices
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 2000);
};

export const toEnglishDigits = (str: string): string => {
    const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const dev = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    const ar = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const fa = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

    return str
        .replace(/[০-৯]/g, (d) => bn.indexOf(d).toString())
        .replace(/[०-९]/g, (d) => dev.indexOf(d).toString())
        .replace(/[٠-٩]/g, (d) => ar.indexOf(d).toString())
        .replace(/[۰-۹]/g, (d) => fa.indexOf(d).toString());
};