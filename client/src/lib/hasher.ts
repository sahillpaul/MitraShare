// Hardware accelerated SHA-256 generation
export const calculateFileHash = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        resolve(hashArray.map(b => b.toString(16).padStart(2, '0')).join(''));
      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
};