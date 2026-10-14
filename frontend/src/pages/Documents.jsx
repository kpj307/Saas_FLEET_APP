import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import api from "../api/axios";
import Navbar from "../components/Navbar";

const emptyForm = {
  vehicle: "",
  title: "",
  document_type: "other",
  expiry_date: "",
  file: null,
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
];

const ALLOWED_FILE_EXTENSIONS = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".txt",
];

function Documents({ onLogout }) {
  const [searchParams] = useSearchParams();

  const [vehicles, setVehicles] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState(emptyForm);

  const [editingDocumentId, setEditingDocumentId] =
    useState(null);

  async function loadData() {
    try {
      setError("");

      const [
        vehiclesResponse,
        documentsResponse,
      ] = await Promise.all([
        api.get("vehicles/"),
        api.get("documents/"),
      ]);

      setVehicles(
        vehiclesResponse.data
      );

      setDocuments(
        documentsResponse.data
      );
    } catch (err) {
      console.error(
        "Documents loading error:",
        err
      );

      if (err.response?.status === 401) {
        setError(
          "Your session has expired. Please log in again."
        );
      } else {
        setError(
          "Unable to load documents."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const documentId = searchParams.get("id");

    if (!documentId || documents.length === 0) {
      return;
    }

    const document = documents.find(
      (item) => String(item.id) === String(documentId)
    );

    if (document) {
      handleEdit(document);
    }
  }, [searchParams, documents]);

  function validateFile(file) {
    if (!file) {
      return "Please select a document file.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "File size must not exceed 5 MB.";
    }

    const fileName =
      file.name.toLowerCase();

    const hasValidExtension =
      ALLOWED_FILE_EXTENSIONS.some(
        (extension) =>
          fileName.endsWith(extension)
      );

    const hasValidMimeType =
      !file.type ||
      ALLOWED_FILE_TYPES.includes(
        file.type
      );

    if (
      !hasValidExtension ||
      !hasValidMimeType
    ) {
      return (
        "Unsupported file type. " +
        "Please upload a PDF, JPG, PNG, WEBP, or TXT file."
      );
    }

    return "";
  }

  function handleChange(event) {
    const {
      name,
      value,
      files,
    } = event.target;

    if (name === "file") {
      const selectedFile =
        files?.[0] || null;

      const fileError =
        validateFile(selectedFile);

      if (fileError) {
        setError(fileError);

        setForm(
          (previousForm) => ({
            ...previousForm,
            file: null,
          })
        );

        event.target.value = "";

        return;
      }

      setError("");

      setForm(
        (previousForm) => ({
          ...previousForm,
          file: selectedFile,
        })
      );

      return;
    }

    setForm(
      (previousForm) => ({
        ...previousForm,
        [name]: value,
      })
    );
  }

  function resetForm() {
    setForm(emptyForm);

    setEditingDocumentId(null);

    setError("");

    const fileInput =
      window.document.getElementById(
        "file"
      );

    if (fileInput) {
      fileInput.value = "";
    }
  }

  function handleEdit(document) {
    setEditingDocumentId(
      document.id
    );

    setForm({
      vehicle: String(
        document.vehicle
      ),
      title:
        document.title || "",
      document_type:
        document.document_type ||
        "other",
      expiry_date:
        document.expiry_date || "",
      file: null,
    });

    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");

    if (!form.vehicle) {
      setError(
        "Please select a vehicle."
      );

      setSaving(false);
      return;
    }

    if (!form.title.trim()) {
      setError(
        "Please enter a document title."
      );

      setSaving(false);
      return;
    }

    if (form.file) {
      const fileError =
        validateFile(form.file);

      if (fileError) {
        setError(fileError);

        setSaving(false);
        return;
      }
    }

    const formData =
      new FormData();

    formData.append(
      "vehicle",
      form.vehicle
    );

    formData.append(
      "title",
      form.title.trim()
    );

    formData.append(
      "document_type",
      form.document_type
    );

    if (form.expiry_date) {
      formData.append(
        "expiry_date",
        form.expiry_date
      );
    } else {
      formData.append(
        "expiry_date",
        ""
      );
    }

    if (form.file) {
      formData.append(
        "file",
        form.file
      );
    }

    try {
      if (editingDocumentId) {
        await api.patch(
          `documents/${editingDocumentId}/`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );
      } else {
        if (!form.file) {
          setError(
            "Please select a document file."
          );

          setSaving(false);
          return;
        }

        await api.post(
          "documents/",
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );
      }

      resetForm();

      await loadData();
    } catch (err) {
      console.error(
        "Document saving error:",
        err
      );

      if (err.response?.data) {
        setError(
          JSON.stringify(
            err.response.data
          )
        );
      } else {
        setError(
          "Unable to save document."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  function getDocumentUrl(document) {
    if (!document.file) {
      return null;
    }

    if (
      document.file.startsWith(
        "http://"
      ) ||
      document.file.startsWith(
        "https://"
      )
    ) {
      return document.file;
    }

    return `http://127.0.0.1:8000${document.file}`;
  }

  function handlePreview(document) {
    const url =
      getDocumentUrl(document);

    if (!url) {
      setError(
        "This document does not have a file."
      );

      return;
    }

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function handleDownload(document) {
    const url =
      getDocumentUrl(document);

    if (!url) {
      setError(
        "This document does not have a file."
      );

      return;
    }

    const link =
      window.document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      document.title ||
      "vehicle-document";

    link.target = "_blank";

    link.rel =
      "noopener noreferrer";

    window.document.body.appendChild(
      link
    );

    link.click();

    window.document.body.removeChild(
      link
    );
  }

  async function handleDelete(
    documentId
  ) {
    const confirmed =
      window.confirm(
        "Delete this document?"
      );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await api.delete(
        `documents/${documentId}/`
      );

      if (
        editingDocumentId ===
        documentId
      ) {
        resetForm();
      }

      await loadData();
    } catch (err) {
      console.error(
        "Document deletion error:",
        err
      );

      if (err.response?.data) {
        setError(
          JSON.stringify(
            err.response.data
          )
        );
      } else {
        setError(
          "Unable to delete document."
        );
      }
    }
  }

  function getVehicleName(
    vehicleId
  ) {
    const vehicle =
      vehicles.find(
        (item) =>
          item.id === vehicleId
      );

    return vehicle
      ? `${vehicle.registration_number} - ${vehicle.make} ${vehicle.model}`
      : "Unknown vehicle";
  }

  function getDocumentTypeLabel(
    documentType
  ) {
    if (!documentType) {
      return "Other";
    }

    return documentType
      .replace(/_/g, " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  }

  function isExpired(
    expiryDate
  ) {
    if (!expiryDate) {
      return false;
    }

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const expiry =
      new Date(
        `${expiryDate}T00:00:00`
      );

    return expiry < today;
  }

  function isExpiringSoon(
    expiryDate
  ) {
    if (!expiryDate) {
      return false;
    }

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const expiry =
      new Date(
        `${expiryDate}T00:00:00`
      );

    const difference =
      expiry.getTime() -
      today.getTime();

    const days =
      difference /
      (1000 * 60 * 60 * 24);

    return (
      days >= 0 &&
      days <= 30
    );
  }

  return (
    <div className="dashboard-page">
      <Navbar
        onLogout={onLogout}
      />

      <header className="dashboard-header">
        <div>
          <h1>Documents</h1>

          <p>
            Upload and manage vehicle
            documents
          </p>
        </div>
      </header>

      {error && (
        <p className="error">
          {error}
        </p>
      )}

      <section className="form-card">
        <h2>
          {editingDocumentId
            ? "Edit Vehicle Document"
            : "Upload Vehicle Document"}
        </h2>

        <form
          className="vehicle-form"
          onSubmit={handleSubmit}
        >
          <div>
            <label htmlFor="vehicle">
              Vehicle
            </label>

            <select
              id="vehicle"
              name="vehicle"
              value={form.vehicle}
              onChange={handleChange}
              required
            >
              <option value="">
                Select vehicle
              </option>

              {vehicles.map(
                (vehicle) => (
                  <option
                    key={vehicle.id}
                    value={vehicle.id}
                  >
                    {
                      vehicle.registration_number
                    }{" "}
                    -{" "}
                    {vehicle.make}{" "}
                    {vehicle.model}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label htmlFor="title">
              Document Title
            </label>

            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Vehicle Logbook"
              required
            />
          </div>

          <div>
            <label htmlFor="document_type">
              Document Type
            </label>

            <select
              id="document_type"
              name="document_type"
              value={
                form.document_type
              }
              onChange={handleChange}
              required
            >
              <option value="logbook">
                Logbook
              </option>

              <option value="registration">
                Registration
              </option>

              <option value="inspection">
                Inspection
              </option>

              <option value="service_receipt">
                Service Receipt
              </option>

              <option value="other">
                Other
              </option>
            </select>
          </div>

          <div>
            <label htmlFor="expiry_date">
              Expiry Date
            </label>

            <input
              id="expiry_date"
              name="expiry_date"
              type="date"
              value={
                form.expiry_date
              }
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="file">
              Document File
            </label>

            <input
              id="file"
              name="file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.txt"
              onChange={handleChange}
              required={
                !editingDocumentId
              }
            />

            <small>
              {editingDocumentId
                ? "Leave empty to keep the existing file. "
                : ""}
              Maximum 5 MB. Supported:
              PDF, JPG, PNG, WEBP, TXT.
            </small>

            {form.file && (
              <small className="selected-file">
                Selected:{" "}
                {form.file.name}
              </small>
            )}

            {editingDocumentId &&
              !form.file && (
                <small className="selected-file">
                  Existing file will be
                  kept.
                </small>
              )}
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingDocumentId
                ? "Update Document"
                : "Upload Document"}
            </button>

            <button
              type="button"
              className="cancel-button"
              onClick={resetForm}
              disabled={saving}
            >
              {editingDocumentId
                ? "Cancel"
                : "Clear"}
            </button>
          </div>
        </form>
      </section>

      <section className="vehicle-list-section">
        <h2>
          Vehicle Documents
        </h2>

        {loading ? (
          <p>
            Loading documents...
          </p>
        ) : documents.length ===
          0 ? (
          <p>
            No documents found.
          </p>
        ) : (
          <div className="vehicle-table-wrapper">
            <table className="vehicle-table">
              <thead>
                <tr>
                  <th>
                    Vehicle
                  </th>

                  <th>
                    Title
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Expiry Date
                  </th>

                  <th>
                    File
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {documents.map(
                  (document) => (
                    <tr
                      key={
                        document.id
                      }
                    >
                      <td>
                        {getVehicleName(
                          document.vehicle
                        )}
                      </td>

                      <td>
                        {document.title}
                      </td>

                      <td>
                        {getDocumentTypeLabel(
                          document.document_type
                        )}
                      </td>

                      <td>
                        {document.expiry_date ? (
                          <span
                            className={
                              isExpired(
                                document.expiry_date
                              )
                                ? "expiry-expired"
                                : isExpiringSoon(
                                    document.expiry_date
                                  )
                                ? "expiry-warning"
                                : ""
                            }
                          >
                            {
                              document.expiry_date
                            }

                            {isExpired(
                              document.expiry_date
                            ) && (
                              <small>
                                {" "}
                                (Expired)
                              </small>
                            )}

                            {!isExpired(
                              document.expiry_date
                            ) &&
                              isExpiringSoon(
                                document.expiry_date
                              ) && (
                                <small>
                                  {" "}
                                  (Expiring
                                  soon)
                                </small>
                              )}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td>
                        {document.file ? (
                          <span>
                            Available
                          </span>
                        ) : (
                          <span>
                            No file
                          </span>
                        )}
                      </td>

                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="edit-button"
                            onClick={() =>
                              handleEdit(
                                document
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="view-button"
                            onClick={() =>
                              handlePreview(
                                document
                              )
                            }
                            disabled={
                              !document.file
                            }
                          >
                            Preview
                          </button>

                          <button
                            type="button"
                            className="download-button"
                            onClick={() =>
                              handleDownload(
                                document
                              )
                            }
                            disabled={
                              !document.file
                            }
                          >
                            Download
                          </button>

                          <button
                            type="button"
                            className="delete-button"
                            onClick={() =>
                              handleDelete(
                                document.id
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Documents;

