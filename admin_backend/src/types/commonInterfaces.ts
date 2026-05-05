interface ServiceResponse {
  http_status: number;
  status: number;
  message: string;
  data?: any;
}

interface ApiResponse {
  status: number;
  message: string;
  data: any;
}
