
export const uploadToCloudinary = async (base64Image: string, cloudName: string, uploadPreset: string): Promise<string> => {
    // Sanitize inputs
    const cleanCloudName = cloudName?.trim();
    const cleanPreset = uploadPreset?.trim();
  
    if (!cleanCloudName || !cleanPreset) {
      throw new Error("Missing Cloudinary Configuration (Cloud Name or Upload Preset)");
    }
  
    const url = `https://api.cloudinary.com/v1_1/${cleanCloudName}/image/upload`;
    
    const formData = new FormData();
    formData.append('file', base64Image);
    formData.append('upload_preset', cleanPreset);
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || "Cloudinary Upload Failed");
      }
  
      return data.secure_url;
    } catch (error: any) {
      console.error("Cloudinary Service Error:", error);
      throw new Error(error.message || "Network Error during image upload");
    }
  };
