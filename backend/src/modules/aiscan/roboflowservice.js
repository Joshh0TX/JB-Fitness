import axios from "axios";

export const detectFood = async (base64Image) => {
  const response = await axios({
    method: "POST",
    url: "https://serverless.roboflow.com/nigeria-food/2",
    params: {
      api_key: process.env.ROBOFLOW_API_KEY
    },
    data: base64Image,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });

  return response.data;
};