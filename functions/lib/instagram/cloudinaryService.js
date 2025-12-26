"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = void 0;
const uploadToCloudinary = async (base64Image, cloudName, uploadPreset) => {
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
    }
    catch (error) {
        console.error("Cloudinary Service Error:", error);
        throw new Error(error.message || "Network Error during image upload");
    }
};
exports.uploadToCloudinary = uploadToCloudinary;
