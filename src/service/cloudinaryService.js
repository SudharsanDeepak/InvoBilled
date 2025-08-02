import axios from "axios";

export const uploadInvoiceThumbnail = async (base64Data) => {
    try {
        // Convert base64 to blob
        const response = await fetch(base64Data);
        const blob = await response.blob();
        
        const formData = new FormData();
        formData.append("file", blob);
        formData.append("upload_preset", "invoices-thumbnail");
        formData.append("cloud_name", "dhadf5h7j");

        const res = await axios.post(
            `https://api.cloudinary.com/v1_1/dhadf5h7j/image/upload`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );

        return res.data.secure_url;
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw error;
    }
};