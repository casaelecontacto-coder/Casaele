import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiSend } from "../../utils/api";

export default function ContentUpload() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const formRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      apiGet(`/api/posts/${id}`)
        .then((post) => {
          setTitle(post.title);
          setDescription(post.description);
          setImageUrl(post.imageUrl);
        })
        .catch((error) => setErr(`Failed to load content: ${error.message}`))
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    if (!title || !imageUrl) {
      setErr("Title and an uploaded image are required.");
      return;
    }

    try {
      setLoading(true);
      const payload = { title, description, imageUrl };
      const url = isEditing ? `/api/posts/${id}` : "/api/posts";
      const method = isEditing ? "PUT" : "POST";
      await apiSend(url, method, payload);
      setMsg(`Content ${isEditing ? "updated" : "submitted"} successfully!`);
      setTimeout(() => navigate("/admin/garden-posts"), 1500);
    } catch (error) {
      setErr(`Submission failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const { timestamp, signature } = await apiGet(
        "/api/cloudinary-signature"
      );
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", import.meta.env.VITE_CLOUDINARY_API_KEY);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      formData.append("upload_preset", "casadeele_materials");
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const resp = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
      if (!resp.ok) throw new Error("Upload failed");
      const data = await resp.json();
      setImageUrl(data.secure_url);
      setMsg("Image uploaded successfully.");
    } catch (er) {
      console.error(er);
      setErr("Image upload failed.");
      setMsg("");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        {isEditing ? "Edit Content" : "Add New Content"}
      </h1>
      {err && (
        <div className="max-w-2xl rounded-md border border-red-200 bg-red-50 text-red-700 px-4 py-2">
          {err}
        </div>
      )}
      {msg && (
        <div className="max-w-2xl rounded-md border border-green-200 bg-green-50 text-green-700 px-4 py-2">
          {msg}
        </div>
      )}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="rounded-xl bg-white shadow-sm border border-gray-200 p-6 space-y-4 max-w-2xl"
      >
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Title
          </label>
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm 
                       focus:border-red-600 focus:ring-2 focus:ring-red-600/30 focus:bg-white 
                       transition-all duration-200 placeholder-gray-400"
            placeholder="Enter title"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Upload Image (Cloudinary)
          </label>
          <input
            onChange={handleFileChange}
            type="file"
            accept="image/*"
            className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm 
                       focus:border-red-600 focus:ring-2 focus:ring-red-600/30 focus:bg-white 
                       transition-all duration-200 file:mr-3 file:py-1 file:px-3 file:rounded-md 
                       file:border-0 file:bg-red-600 file:text-white file:text-sm hover:file:bg-red-700 cursor-pointer"
          />
          {uploading && (
            <div className="text-sm text-gray-500 mt-1">Uploading...</div>
          )}
          {imageUrl && (
            <div className="mt-2">
              <img
                src={imageUrl}
                alt="preview"
                className="h-32 rounded-md border shadow-sm"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
            className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm 
                       focus:border-red-600 focus:ring-2 focus:ring-red-600/30 focus:bg-white 
                       transition-all duration-200 placeholder-gray-400"
            placeholder="Write a description..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-4 py-2 rounded-md bg-red-700 text-white hover:bg-red-800 transition disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : isEditing
            ? "Update Content"
            : "Submit Content"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/admin/garden-posts")}
          className="px-4 py-2 rounded-md border hover:bg-gray-50"
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
