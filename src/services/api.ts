import qs from "qs";

const BASE_URL = "https://wcc-accre-bedev.onrender.com";

/** Strapi v5 can return duplicate entries (draft/publish). Deduplicate by documentId, keeping first occurrence. */
function deduplicateByDocumentId(items: any[]): any[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.documentId) return true;
    if (seen.has(item.documentId)) return false;
    seen.add(item.documentId);
    return true;
  });
}

export const api = {
  /**
   * Register a new user
   */
  register: async (data: any) => {
    console.log("Registering with:", data);
    const response = await fetch(`${BASE_URL}/api/auth/local/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("Registration error:", result);
      throw new Error(result.error?.message || "Registration failed");
    }
    return result;
  },

  /**
   * Update user profile fields (non-role fields)
   */
  updateUser: async (
    token: string,
    userId: number,
    data: Record<string, any>,
  ) => {
    const response = await fetch(`${BASE_URL}/api/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error?.message || "Failed to update user profile");
    }
    return result;
  },

  /**
   * Login user
   */
  login: async (data: any) => {
    console.log("Logging in with:", data);
    const response = await fetch(`${BASE_URL}/api/auth/local`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("Login error:", result);
      throw new Error(result.error?.message || "Login failed");
    }
    return result;
  },

  /**
   * Get current user data
   */
  getMe: async (token: string) => {
    // Decode user ID from JWT to use /api/users/:id (more reliable than /api/users/me)
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.id;

    const query = qs.stringify(
      {
        populate: {
          role: true,
          campuses: true,
          personel_role: {
            populate: {
              coveredAreas: true,
              coveredPrograms: {
                populate: ["academic_program"],
              },
            },
          },
        },
      },
      { encodeValuesOnly: true },
    );
    const response = await fetch(`${BASE_URL}/api/users/${userId}?${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error?.message || "Failed to fetch user data");
    }
    return result;
  },

  /**
   * Academic Years CRUD
   */
  getAcademicYears: async (token: string) => {
    const query = qs.stringify(
      {
        sort: ["createdAt:desc"],
        pagination: { pageSize: 100 },
      },
      { encodeValuesOnly: true },
    );
    const response = await fetch(`${BASE_URL}/api/academic-years?${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok) {
      console.error("API Error Response:", result);
      throw new Error(
        result.error?.message || "Failed to fetch academic years",
      );
    }
    return deduplicateByDocumentId(result.data);
  },

  createAcademicYear: async (token: string, data: any) => {
    const response = await fetch(`${BASE_URL}/api/academic-years`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        result.error?.message || "Failed to create academic year",
      );
    return result.data;
  },

  updateAcademicYear: async (token: string, id: string | number, data: any) => {
    const response = await fetch(`${BASE_URL}/api/academic-years/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        result.error?.message || "Failed to update academic year",
      );
    return result.data;
  },

  deleteAcademicYear: async (token: string, id: string | number) => {
    const response = await fetch(`${BASE_URL}/api/academic-years/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(
        result.error?.message || "Failed to delete academic year",
      );
    }
    return true;
  },

  /**
   * Academic Programs CRUD
   */
  getAcademicPrograms: async (token?: string) => {
    const headers: any = {
      Accept: "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const query = qs.stringify(
      {
        sort: ["createdAt:desc"],
        pagination: { pageSize: 100 },
        populate: { program_type: true },
      },
      { encodeValuesOnly: true },
    );
    const response = await fetch(`${BASE_URL}/api/academic-programs?${query}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const result = await response.json();
    console.log("Full API Response for academic-programs:", result);
    if (!response.ok) {
      console.error("API Error Response:", result);
      throw new Error(
        result.error?.message || "Failed to fetch academic programs",
      );
    }
    return deduplicateByDocumentId(result.data);
  },

  createAcademicProgram: async (token: string, data: any) => {
    const response = await fetch(`${BASE_URL}/api/academic-programs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        result.error?.message || "Failed to create academic program",
      );
    return result.data;
  },

  updateAcademicProgram: async (
    token: string,
    id: string | number,
    data: any,
  ) => {
    const response = await fetch(`${BASE_URL}/api/academic-programs/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        result.error?.message || "Failed to update academic program",
      );
    return result.data;
  },

  deleteAcademicProgram: async (token: string, id: string | number) => {
    const response = await fetch(`${BASE_URL}/api/academic-programs/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(
        result.error?.message || "Failed to delete academic program",
      );
    }
    return true;
  },

  /**
   * Areas CRUD
   */
  getAreas: async (token: string) => {
    const query = qs.stringify(
      {
        sort: ["createdAt:desc"],
        pagination: { pageSize: 100 },
        populate: {
          campus: true,
          areaCriteria: {
            populate: {
              criteriaUploads: {
                populate: {
                  fileUpload: true,
                  uploader: true,
                  approver: true,
                  campus: true,
                  academic_program: true,
                  academic_year: true,
                  semester: true,
                  visit: true,
                },
              },
              subcriteria: {
                populate: {
                  subCriteriaUploads: {
                    populate: {
                      fileUpload: true,
                      uploader: true,
                      approver: true,
                      campus: true,
                      academic_program: true,
                      academic_year: true,
                      semester: true,
                      visit: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      { encodeValuesOnly: true },
    );
    const response = await fetch(`${BASE_URL}/api/areas?${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error?.message || "Failed to fetch areas");
    return deduplicateByDocumentId(result.data);
  },

  getAreaById: async (token: string, id: string | number) => {
    // Using deep population for nested criteria and uploads
    const query = qs.stringify(
      {
        populate: {
          campus: true,
          areaCriteria: {
            populate: {
              criteriaUploads: {
                populate: {
                  fileUpload: true,
                  uploader: true,
                  approver: true,
                  campus: true,
                  academic_program: true,
                  academic_year: true,
                  semester: true,
                  visit: true,
                },
              },
              subcriteria: {
                populate: {
                  subCriteriaUploads: {
                    populate: {
                      fileUpload: true,
                      uploader: true,
                      approver: true,
                      campus: true,
                      academic_program: true,
                      academic_year: true,
                      semester: true,
                      visit: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      { encodeValuesOnly: true },
    );

    const response = await fetch(`${BASE_URL}/api/areas/${id}?${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error?.message || "Failed to fetch area details");
    return result.data;
  },

  createArea: async (token: string, data: any) => {
    const response = await fetch(`${BASE_URL}/api/areas`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error?.message || "Failed to create area");
    return result.data;
  },

  updateArea: async (token: string, id: string | number, data: any) => {
    const response = await fetch(`${BASE_URL}/api/areas/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error?.message || "Failed to update area");
    return result.data;
  },

  deleteArea: async (token: string, id: string | number) => {
    const response = await fetch(`${BASE_URL}/api/areas/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Failed to delete area");
    return true;
  },

  /**
   * Personel Roles CRUD
   */
  getPersonelRoles: async (token: string) => {
    const query = qs.stringify(
      {
        sort: ["role:asc"],
        pagination: { pageSize: 100 },
        populate: {
          coveredAreas: true,
          coveredPrograms: {
            populate: ["academic_program"],
          },
        },
      },
      { encodeValuesOnly: true },
    );
    const response = await fetch(`${BASE_URL}/api/personel-roles?${query}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        result.error?.message || "Failed to fetch personel roles",
      );
    return deduplicateByDocumentId(result.data);
  },

  createPersonelRole: async (token: string, data: any) => {
    const response = await fetch(`${BASE_URL}/api/personel-roles`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        result.error?.message || "Failed to create personel role",
      );
    return result.data;
  },

  updatePersonelRole: async (token: string, id: string | number, data: any) => {
    const response = await fetch(`${BASE_URL}/api/personel-roles/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        result.error?.message || "Failed to update personel role",
      );
    return result.data;
  },

  deletePersonelRole: async (token: string, id: string | number) => {
    const response = await fetch(`${BASE_URL}/api/personel-roles/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(
        result.error?.message || "Failed to delete personel role",
      );
    }
    return true;
  },

  /**
   * Get all users (for admin)
   */
  getUsers: async (token: string) => {
    const query = qs.stringify(
      {
        populate: ["role", "personel_role", "campuses"],
        pagination: { pageSize: 200 },
      },
      { encodeValuesOnly: true },
    );
    const response = await fetch(`${BASE_URL}/api/users?${query}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error?.message || "Failed to fetch users");
    return result;
  },

  /**
   * Sync allowedCriteria in all personel roles when criteria codes change
   * oldToNewMap: { "B.1": "B.1.1", "B.2": null } — null means deleted
   */
  syncAllowedCriteria: async (
    token: string,
    areaName: string,
    oldToNewMap: Record<string, string | null>,
  ) => {
    const roles = await api.getPersonelRoles(token);
    for (const role of roles) {
      const coveredAreas = role.coveredAreas || [];
      let needsUpdate = false;
      const updatedAreas = coveredAreas.map((a: any) => {
        if (a.area_with_permission !== areaName) return a;
        if (!a.allowedCriteria || a.allowedCriteria.trim() === "") return a;

        const codes = a.allowedCriteria
          .split(",")
          .map((c: string) => c.trim())
          .filter(Boolean);
        const newCodes = codes
          .map((code: string) => {
            if (code in oldToNewMap) {
              needsUpdate = true;
              return oldToNewMap[code]; // null = deleted, string = renamed
            }
            return code;
          })
          .filter(Boolean) as string[];

        return { ...a, allowedCriteria: newCodes.join(",") };
      });

      if (needsUpdate) {
        await api.updatePersonelRole(token, role.documentId, {
          coveredAreas: updatedAreas.map((a: any) => ({
            area_with_permission: a.area_with_permission,
            allowedCriteria: a.allowedCriteria || "",
          })),
        });
      }
    }
  },

  /**
   * Campuses CRUD
   */
  getCampuses: async (token: string) => {
    const query = qs.stringify(
      { sort: ["createdAt:desc"], pagination: { pageSize: 100 } },
      { encodeValuesOnly: true },
    );
    const response = await fetch(`${BASE_URL}/api/campuses?${query}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error?.message || "Failed to fetch campuses");
    return deduplicateByDocumentId(result.data);
  },
  createCampus: async (token: string, data: any) => {
    const response = await fetch(`${BASE_URL}/api/campuses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error?.message || "Failed to create campus");
    return result.data;
  },
  updateCampus: async (token: string, id: string | number, data: any) => {
    const response = await fetch(`${BASE_URL}/api/campuses/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error?.message || "Failed to update campus");
    return result.data;
  },
  deleteCampus: async (token: string, id: string | number) => {
    const response = await fetch(`${BASE_URL}/api/campuses/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error?.message || "Failed to delete campus");
    }
    return true;
  },

  /**
   * Semesters CRUD
   */
  getSemesters: async (token: string) => {
    const query = qs.stringify(
      { sort: ["createdAt:desc"], pagination: { pageSize: 100 } },
      { encodeValuesOnly: true },
    );
    const response = await fetch(`${BASE_URL}/api/semesters?${query}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error?.message || "Failed to fetch semesters");
    return deduplicateByDocumentId(result.data);
  },
  createSemester: async (token: string, data: any) => {
    const response = await fetch(`${BASE_URL}/api/semesters`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error?.message || "Failed to create semester");
    return result.data;
  },
  updateSemester: async (token: string, id: string | number, data: any) => {
    const response = await fetch(`${BASE_URL}/api/semesters/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error?.message || "Failed to update semester");
    return result.data;
  },
  deleteSemester: async (token: string, id: string | number) => {
    const response = await fetch(`${BASE_URL}/api/semesters/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error?.message || "Failed to delete semester");
    }
    return true;
  },

  /**
   * Program Types CRUD
   */
  getProgramTypes: async (token: string) => {
    const query = qs.stringify(
      { sort: ["createdAt:desc"], pagination: { pageSize: 100 } },
      { encodeValuesOnly: true },
    );
    const response = await fetch(`${BASE_URL}/api/programs?${query}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error?.message || "Failed to fetch program types");
    return deduplicateByDocumentId(result.data);
  },
  createProgramType: async (token: string, data: any) => {
    const response = await fetch(`${BASE_URL}/api/programs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error?.message || "Failed to create program type");
    return result.data;
  },
  updateProgramType: async (token: string, id: string | number, data: any) => {
    const response = await fetch(`${BASE_URL}/api/programs/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error?.message || "Failed to update program type");
    return result.data;
  },
  deleteProgramType: async (token: string, id: string | number) => {
    const response = await fetch(`${BASE_URL}/api/programs/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error?.message || "Failed to delete program type");
    }
    return true;
  },

  /**
   * Visit Types CRUD
   */
  getVisitTypes: async (token: string) => {
    const query = qs.stringify(
      { sort: ["createdAt:desc"], pagination: { pageSize: 100 } },
      { encodeValuesOnly: true },
    );
    const response = await fetch(`${BASE_URL}/api/visit-types?${query}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error?.message || "Failed to fetch visit types");
    return deduplicateByDocumentId(result.data);
  },
  createVisitType: async (token: string, data: any) => {
    const response = await fetch(`${BASE_URL}/api/visit-types`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error?.message || "Failed to create visit type");
    return result.data;
  },
  updateVisitType: async (token: string, id: string | number, data: any) => {
    const response = await fetch(`${BASE_URL}/api/visit-types/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error?.message || "Failed to update visit type");
    return result.data;
  },
  deleteVisitType: async (token: string, id: string | number) => {
    const response = await fetch(`${BASE_URL}/api/visit-types/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error?.message || "Failed to delete visit type");
    }
    return true;
  },

  /**
   * File Upload
   */
  getFileById: async (token: string, fileId: number) => {
    const response = await fetch(`${BASE_URL}/api/upload/files/${fileId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error?.message || "Failed to fetch file info");
    return result;
  },

  uploadFile: async (token: string, file: File) => {
    const formData = new FormData();
    formData.append("files", file);

    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error?.message || "File upload failed");
    return result[0]; // Returns array of uploaded files
  },
};
