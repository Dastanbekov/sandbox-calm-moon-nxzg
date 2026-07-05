export interface User {
  id: number;
  email: string;
  name: string;
  sname?: string;
  phone?: string;
  photo: string | null;
  personal_bill: string;
  balance: string | number;
  is_staff: boolean;
  user_type: 'employer' | 'worker' | 'admin';
  company_id?: number;
  company?: {
    id: number;
    title: string;
    logo: string | null;
    is_leading: boolean;
    super_hr_type: string | null;
    about_company?: string;
    site?: string;
    is_verified?: boolean;
    verification_status?: 'pending' | 'approved' | 'rejected' | null;
    org_type?: string;
    size?: string;
    inn?: string;
    scope?: any;
    city?: any;
    scope_detail?: any;
    city_detail?: any;
    address?: string;
    google_map_code?: string;
    fio?: string;
    show_fio?: boolean;
    phone?: string;
    show_phone?: boolean;
    email?: string;
    show_email?: boolean;
    show_site?: boolean;
  };
  profile?: {
    id: number;
    name: string;
    sname: string | null;
    photo: string | null;
    phone?: string;
    show_phone?: boolean;
    address?: string;
    gender?: string;
    city?: number | string;
    search_status?: string;
    mname?: string;
    date_of_birth?: string;
    citizenship?: string | number;
  };
}

export interface AuthResponse {
  user: User;
  access: string;
}

export interface Lookups {
  scopes: any[];
  cities: any[];
  busynesses: any[];
  educations: any[];
  currencies: any[];
  citizenships: any[];
  languages: any[];
  proficiencies: any[];
  complain_reasons: any[];
}

export interface Vacancy {
  id: number;
  position: string;
  wages_from?: number | null;
  wages_to?: number | null;
  currency_detail?: any;
  city_detail?: any;
  scope_detail?: any;
  busyness_detail?: any;
  anonim?: boolean;
  is_fixed?: boolean;
  is_hot?: boolean;
  in_priority?: boolean;
  upped?: boolean;
  company_is_verified?: boolean;
  company: any;
  count_view?: number;
  count_response?: number;
  draft?: boolean;
  moderated?: boolean;
  archive?: boolean;
  response_email_notifications?: boolean;
  only_in_english?: boolean;
  created_at?: string;
  short_description?: string;
  requirements?: string;
  overview?: string;
  qualification_requirements?: string;
  duties?: string;
  conditions?: string;
  experience?: string;
  city?: any;
  scope?: any;
  busyness?: any;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  work_format?: string;
  salary_net?: boolean;
  bonuses?: any;
  company_logo?: string | null;
  company_title?: string;
  company_id?: number;
  company_size?: string;
  company_org_type?: string;
  company_about?: string;
}

export interface Resume {
  id: number;
  user_id?: number;
  position?: string;
  career_objective?: string;
  wages?: number | null;
  currency_detail?: any;
  city_detail?: any;
  scope_detail?: any;
  busyness_detail?: any;
  upped?: boolean;
  profile?: any;
  photo?: string | null;
  name?: string;
  sname?: string;
  mname?: string;
  created_at?: string;
  updated_at?: string;
  phone?: string;
  email?: string;
  about?: string;
  career_objective?: string;
  salary?: number | null;
  key_skills?: string;
  about_me?: string;
  draft?: boolean;
  moderated?: boolean;
  has_contact_access?: boolean;
  is_fixed?: boolean;
  is_hot?: boolean;
  is_hidden?: boolean;
  in_priority?: boolean;
  work_experiences?: any[];
  institutions?: any[];
  extra_institutions?: any[];
  languages?: any[];
  resume_languages?: any[];
  city?: number;
  scope?: number;
  busyness?: number;
  
  // New fields for the 6-step form
  citizenship?: number | null;
  native_language?: number | null;
  language?: number | null; // language of the resume
  
  file1?: string | null;
  filename1?: string | null;
  file2?: string | null;
  filename2?: string | null;
  file3?: string | null;
  filename3?: string | null;
}

export interface VacancyResponse {
  id: number;
  status?: string;
  detail?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
