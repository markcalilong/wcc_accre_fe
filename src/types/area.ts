export interface FileUploadMetadata {
  id: number;
  documentId?: string;
  fileName: string;
  remarks?: string;
  fileStatus: 'On-going Review' | 'Reviewed' | 'Approved';
  fileUpload?: {
    id: number;
    documentId?: string;
    url: string;
    name: string;
    ext: string;
  };
  uploader?: {
    id: number;
    documentId?: string;
    username: string;
  };
  approver?: {
    id: number;
    documentId?: string;
    username: string;
  };
}

export interface SubCriteria {
  id: number;
  documentId?: string;
  code: string;
  desc: string;
  subCriteriaUploads: FileUploadMetadata[];
}

export interface AreaCriteria {
  id: number;
  documentId?: string;
  code: string;
  desc: string;
  criteriaUploads: FileUploadMetadata[];
  subcriteria: SubCriteria[];
}

export interface Area {
  id: number;
  documentId?: string;
  area: string;
  areaDesc: string;
  proposedExhibits?: string;
  remarks?: string;
  academic_program?: {
    id: number;
    documentId?: string;
    programDesc?: string;
    programCode?: string;
  };
  academic_year?: {
    id: number;
    documentId?: string;
    schoolyear?: string;
    locale?: string;
  };
  areaCriteria: AreaCriteria[];
}
