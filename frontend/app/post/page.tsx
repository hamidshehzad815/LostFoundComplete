"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuthToken, isAuthenticated } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import dynamic from "next/dynamic";
import { API_ENDPOINTS } from "@/lib/config";
import "./post.css";

// Dynamically import MapSelector to avoid SSR issues
const MapSelector = dynamic(() => import("@/components/MapSelector"), {
  ssr: false,
  loading: () => <div className="map-loading">Loading map...</div>,
});

const CATEGORIES = [
  "Electronics",
  "Mobile Phones",
  "Laptops & Computers",
  "Tablets",
  "Cameras",
  "Headphones & Audio",
  "Smart Watches",
  "Gaming Devices",
  "Documents",
  "ID Cards",
  "Passports",
  "Licenses",
  "Certificates",
  "Bank Cards",
  "Jewelry",
  "Rings",
  "Necklaces",
  "Bracelets",
  "Earrings",
  "Watches",
  "Pets",
  "Dogs",
  "Cats",
  "Birds",
  "Other Pets",
  "Bags & Luggage",
  "Backpacks",
  "Handbags",
  "Suitcases",
  "Wallets & Purses",
  "Keys & Keychains",
  "Clothing",
  "Jackets",
  "Shoes",
  "Hats & Caps",
  "Scarves",
  "Accessories",
  "Glasses & Sunglasses",
  "Umbrellas",
  "Books & Notebooks",
  "Sports Equipment",
  "Toys & Games",
  "Musical Instruments",
  "Tools",
  "Medical Equipment",
  "Vehicles",
  "Bicycles",
  "Motorcycles",
  "Other",
];

const CITIES = [
  "Lahore",
  "Karachi",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Gujranwala",
];

const CITY_AREAS: { [key: string]: string[] } = {
  Lahore: [
    "Model Town",
    "Gulberg",
    "DHA",
    "Johar Town",
    "Bahria Town",
    "Cantt",
    "Mall Road",
    "Liberty",
    "Anarkali",
    "Garden Town",
    "Faisal Town",
    "Township",
    "Iqbal Town",
    "Allama Iqbal Town",
    "Valencia Town",
    "Wapda Town",
    "EME Society",
    "Cavalry Ground",
    "Shadman",
    "Shalimar",
  ],
  Karachi: [
    "Clifton",
    "DHA",
    "Gulshan-e-Iqbal",
    "Saddar",
    "North Nazimabad",
    "Malir",
    "Korangi",
    "Lyari",
    "Keamari",
    "Orangi Town",
    "Shah Faisal Colony",
    "Landhi",
    "Tariq Road",
    "Bahadurabad",
    "PECHS",
  ],
  Islamabad: [
    "F-6",
    "F-7",
    "F-8",
    "F-10",
    "F-11",
    "G-6",
    "G-7",
    "G-8",
    "G-9",
    "G-10",
    "G-11",
    "I-8",
    "I-9",
    "I-10",
    "Blue Area",
    "Bahria Town",
    "DHA",
  ],
  Rawalpindi: [
    "Saddar",
    "Satellite Town",
    "Bahria Town",
    "Chaklala",
    "Westridge",
    "Commercial Market",
    "PWD",
    "Askari",
    "Gulzar-e-Quaid",
    "Dhoke Khabba",
  ],
  Faisalabad: [
    "Civil Lines",
    "Samanabad",
    "Peoples Colony",
    "Gulberg",
    "Madina Town",
    "Kohinoor City",
    "Susan Road",
    "Jhang Road",
    "Sargodha Road",
  ],
  Multan: [
    "Cantt",
    "Gulgasht",
    "New Multan",
    "Model Town",
    "Shah Rukn-e-Alam",
    "Bosan Road",
    "MDA Chowk",
    "Chungi No 9",
  ],
  Peshawar: [
    "Saddar",
    "University Town",
    "Hayatabad",
    "Cantt",
    "Gulbahar",
    "Faqirabad",
    "Khyber Bazaar",
  ],
  Quetta: [
    "Cantt",
    "Jinnah Town",
    "Satellite Town",
    "Zarghoon Road",
    "Brewery Road",
    "Samungli Road",
  ],
  Sialkot: [
    "Cantt",
    "Civil Lines",
    "Paris Road",
    "Kutchery Road",
    "Gondlanwala",
    "Hajipura",
  ],
  Gujranwala: [
    "Civil Lines",
    "Satellite Town",
    "Model Town",
    "Peoples Colony",
    "DC Road",
    "Wapda Town",
  ],
};

export default function PostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");

  const [itemType, setItemType] = useState<"lost" | "found">(
    typeParam === "found" ? "found" : "lost",
  );
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subCategory: "",
    date: "",
    city: "Lahore",
    area: "",
    address: "",
    latitude: "",
    longitude: "",
    rewardAmount: "",
    tags: "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "city" ? { area: "" } : {}),
    }));
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        )
          .then((res) => res.json())
          .then((data) => {
            const address = data.address;
            const city = address.city || address.town || address.village || "";
            const area = address.suburb || address.neighbourhood || "";
            const road = address.road || "";

            const matchedCity = CITIES.find(
              (c) => c.toLowerCase() === city.toLowerCase(),
            );

            setFormData((prev) => ({
              ...prev,
              city: matchedCity || prev.city,
              area: area,
              address: road || data.display_name,
              latitude: latitude.toString(),
              longitude: longitude.toString(),
            }));

            setLocationLoading(false);
          })
          .catch((err) => {
            console.error("Geocoding error:", err);
            setError("Could not fetch address from location");
            setLocationLoading(false);
          });
      },
      (error) => {
        console.error("Geolocation error:", error);
        setError("Could not get your location. Please enter manually.");
        setLocationLoading(false);
      },
    );
  };

  const handleMapClick = (lat: number, lng: number) => {
    setLocationLoading(true);
    setError("");

    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
    )
      .then((res) => res.json())
      .then((data) => {
        const address = data.address;
        const city = address.city || address.town || address.village || "";
        const area = address.suburb || address.neighbourhood || "";
        const road = address.road || "";

        const matchedCity = CITIES.find(
          (c) => c.toLowerCase() === city.toLowerCase(),
        );

        setFormData((prev) => ({
          ...prev,
          city: matchedCity || prev.city,
          area: area,
          address: road || data.display_name,
          latitude: lat.toString(),
          longitude: lng.toString(),
        }));

        setShowMap(false);
        setLocationLoading(false);
      })
      .catch((err) => {
        console.error("Geocoding error:", err);
        setError("Could not fetch address from location");
        setLocationLoading(false);
      });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length + images.length > 5) {
      setError("Maximum 5 images allowed");
      return;
    }

    setImages((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = getAuthToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("type", itemType);
      submitData.append("category", formData.category);
      if (formData.subCategory)
        submitData.append("subCategory", formData.subCategory);
      submitData.append("date", formData.date);

      submitData.append("location[address]", formData.address);
      submitData.append("location[city]", formData.city);
      if (formData.area) submitData.append("location[area]", formData.area);
      if (formData.latitude && formData.longitude) {
        submitData.append(
          "location[coordinates]",
          `${formData.longitude},${formData.latitude}`,
        );
      }

      if (formData.rewardAmount) {
        submitData.append("reward[amount]", formData.rewardAmount);
        submitData.append("reward[currency]", "PKR");
      }

      if (formData.tags) {
        const tagsArray = formData.tags.split(",").map((tag) => tag.trim());
        tagsArray.forEach((tag) => submitData.append("tags[]", tag));
      }

      images.forEach((image) => {
        submitData.append("images", image);
      });

      const response = await fetch(API_ENDPOINTS.ITEMS, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to post item");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Navigation />
        <div className="success-screen">
          <div className="success-content">
            <div className="success-icon">✅</div>
            <h1>Item Posted Successfully!</h1>
            <p>Redirecting to dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="post-container">
        <button className="back-btn" onClick={() => router.back()}>
          ← Back
        </button>
        <div className="post-header">
          <h1>Post {itemType === "lost" ? "Lost" : "Found"} Item</h1>
          <div className="type-toggle">
            <button
              className={`toggle-btn ${itemType === "lost" ? "active" : ""}`}
              onClick={() => setItemType("lost")}
            >
              🔍 Lost
            </button>
            <button
              className={`toggle-btn ${itemType === "found" ? "active" : ""}`}
              onClick={() => setItemType("found")}
            >
              🎁 Found
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="post-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-section">
            <h3>📝 Basic Information</h3>

            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder={`e.g., ${itemType === "lost" ? "Lost iPhone 13 Pro" : "Found Brown Leather Wallet"}`}
                required
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Provide detailed description including color, brand, unique features..."
                required
                rows={5}
                maxLength={1000}
              />
              <span className="char-count">
                {formData.description.length}/1000
              </span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="subCategory">Sub-Category</label>
                <input
                  type="text"
                  id="subCategory"
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleInputChange}
                  placeholder="Optional: e.g., iPhone 13"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="date">
                Date {itemType === "lost" ? "Lost" : "Found"} *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
          </div>

          <div className="form-section">
            <div className="location-header">
              <h3>📍 Location</h3>
              <button
                type="button"
                className="use-location-btn"
                onClick={handleUseMyLocation}
                disabled={locationLoading}
              >
                {locationLoading ? "Getting Location..." : "📍 Use My Location"}
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City *</label>
                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                >
                  {CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="area">Area</label>
                <select
                  id="area"
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                >
                  <option value="">Select Area (Optional)</option>
                  {CITY_AREAS[formData.city]?.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">Specific Address *</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="e.g., Near Model Town Park, Main Boulevard"
                required
              />
            </div>

            <div className="map-selection">
              <button
                type="button"
                className="select-map-btn"
                onClick={() => setShowMap(!showMap)}
              >
                🗺️ {showMap ? "Hide Map" : "Select Location on Map"}
              </button>
              {formData.latitude && formData.longitude && (
                <div className="coordinates-display">
                  📍 Coordinates: {parseFloat(formData.latitude).toFixed(6)},{" "}
                  {parseFloat(formData.longitude).toFixed(6)}
                </div>
              )}
            </div>

            {showMap && (
              <div className="map-container">
                <div className="map-instructions">
                  Click anywhere on the map to select your location
                </div>
                <MapSelector
                  onLocationSelect={handleMapClick}
                  initialLat={
                    formData.latitude ? parseFloat(formData.latitude) : 31.5204
                  }
                  initialLng={
                    formData.longitude
                      ? parseFloat(formData.longitude)
                      : 74.3587
                  }
                />
              </div>
            )}
          </div>

          <div className="form-section">
            <h3>📷 Images (Up to 5)</h3>

            <div className="image-upload-area">
              <input
                type="file"
                id="images"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                style={{ display: "none" }}
                disabled={images.length >= 5}
              />
              <label
                htmlFor="images"
                className={`upload-label ${images.length >= 5 ? "disabled" : ""}`}
              >
                <div className="upload-icon">📸</div>
                <p>Click to upload images</p>
                <span>{images.length}/5 images</span>
              </label>
            </div>

            {imagePreviews.length > 0 && (
              <div className="image-previews">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="image-preview">
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => removeImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-section">
            <h3>💰 Reward & Tags</h3>

            <div className="form-group">
              <label htmlFor="rewardAmount">Reward Amount (PKR)</label>
              <input
                type="number"
                id="rewardAmount"
                name="rewardAmount"
                value={formData.rewardAmount}
                onChange={handleInputChange}
                placeholder="Optional: Enter reward amount"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags (comma separated)</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="e.g., iPhone, black, ModelTown"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => router.back()}
            >
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading
                ? "Posting..."
                : `Post ${itemType === "lost" ? "Lost" : "Found"} Item`}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
