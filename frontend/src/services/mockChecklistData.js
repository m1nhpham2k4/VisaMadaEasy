// Mock data for a US Master's Degree checklist
const mockChecklistData = {
  "id": 1,
  "title": "Du học bằng thạc sĩ Mỹ",
  "due_date": "2024-12-31T00:00:00Z",
  "status": "in_progress",
  "created_at": "2023-10-15T09:00:00Z",
  "updated_at": "2023-11-01T15:30:00Z",
  "categories": [
    {
      "id": 1,
      "name": "Giấy tờ cá nhân",
      "order": 1,
      "items": [
        {
          "id": 101,
          "description": "Hộ chiếu",
          "is_completed": true,
          "due_date": "2024-02-28T00:00:00Z",
          "notes": "Đã có hộ chiếu mới, hết hạn 2029",
          "order": 1
        },
        {
          "id": 102,
          "description": "CMND/CCCD",
          "is_completed": true,
          "due_date": "2024-02-28T00:00:00Z",
          "notes": "Đã làm CCCD gắn chip",
          "order": 2
        },
        {
          "id": 103,
          "description": "Ảnh thẻ (nền trắng, 5x5cm)",
          "is_completed": false,
          "due_date": "2024-03-15T00:00:00Z",
          "notes": "Cần chụp 8 tấm, mặc áo sơ mi trắng/xanh nhạt",
          "order": 3
        },
        {
          "id": 104,
          "description": "Giấy khai sinh",
          "is_completed": true,
          "due_date": "2024-03-30T00:00:00Z",
          "notes": "Bản sao công chứng đã chuẩn bị",
          "order": 4
        }
      ]
    },
    {
      "id": 2,
      "name": "Hồ sơ học vấn",
      "order": 2,
      "items": [
        {
          "id": 201,
          "description": "Bằng cử nhân (bản sao công chứng)",
          "is_completed": true,
          "due_date": "2024-03-01T00:00:00Z",
          "notes": "Bản tiếng Anh và tiếng Việt",
          "order": 1
        },
        {
          "id": 202,
          "description": "Bảng điểm đại học (bản sao công chứng)",
          "is_completed": true,
          "due_date": "2024-03-01T00:00:00Z",
          "notes": "Bản tiếng Anh và tiếng Việt, có xác nhận GPA 3.5/4.0",
          "order": 2
        },
        {
          "id": 203,
          "description": "Chứng chỉ IELTS/TOEFL",
          "is_completed": false,
          "due_date": "2024-04-15T00:00:00Z",
          "notes": "Cần đạt IELTS 7.0 trở lên, đã đăng ký thi ngày 20/03",
          "order": 3
        },
        {
          "id": 204,
          "description": "Chứng chỉ GRE (nếu cần)",
          "is_completed": false,
          "due_date": "2024-05-01T00:00:00Z",
          "notes": "Kiểm tra yêu cầu của từng trường",
          "order": 4
        }
      ]
    },
    {
      "id": 3,
      "name": "Tài chính",
      "order": 3,
      "items": [
        {
          "id": 301,
          "description": "Sao kê tài khoản ngân hàng (6 tháng gần nhất)",
          "is_completed": false,
          "due_date": "2024-05-15T00:00:00Z",
          "notes": "Cần có số dư tối thiểu $30,000 USD",
          "order": 1
        },
        {
          "id": 302,
          "description": "Thư bảo lãnh tài chính",
          "is_completed": false,
          "due_date": "2024-05-30T00:00:00Z",
          "notes": "Cần công chứng",
          "order": 2
        },
        {
          "id": 303,
          "description": "Hợp đồng cho vay du học (nếu có)",
          "is_completed": false,
          "due_date": "2024-06-15T00:00:00Z",
          "notes": null,
          "order": 3
        }
      ]
    },
    {
      "id": 4,
      "name": "Đơn xin học",
      "order": 4,
      "items": [
        {
          "id": 401,
          "description": "Bài luận cá nhân (Personal Statement)",
          "is_completed": false,
          "due_date": "2024-04-20T00:00:00Z",
          "notes": "Đã hoàn thành bản nháp, cần sửa lại",
          "order": 1
        },
        {
          "id": 402,
          "description": "CV/Resume học thuật",
          "is_completed": false,
          "due_date": "2024-04-15T00:00:00Z",
          "notes": "Cần cập nhật các dự án nghiên cứu mới",
          "order": 2
        },
        {
          "id": 403,
          "description": "Thư giới thiệu (3 thư)",
          "is_completed": false,
          "due_date": "2024-05-10T00:00:00Z",
          "notes": "Đã liên hệ với GS. Nguyễn và GS. Trần, còn thiếu 1",
          "order": 3
        }
      ]
    },
    {
      "id": 5,
      "name": "Visa",
      "order": 5,
      "items": [
        {
          "id": 501,
          "description": "Form DS-160",
          "is_completed": false,
          "due_date": "2024-07-01T00:00:00Z",
          "notes": "Chờ thư mời nhập học",
          "order": 1
        },
        {
          "id": 502,
          "description": "Lệ phí SEVIS",
          "is_completed": false,
          "due_date": "2024-07-10T00:00:00Z",
          "notes": "$350 USD, thanh toán online",
          "order": 2
        },
        {
          "id": 503,
          "description": "Đặt lịch phỏng vấn visa",
          "is_completed": false,
          "due_date": "2024-07-15T00:00:00Z",
          "notes": "Lịch phỏng vấn thường kín 1-2 tháng",
          "order": 3
        },
        {
          "id": 504,
          "description": "Chuẩn bị hồ sơ phỏng vấn visa",
          "is_completed": false,
          "due_date": "2024-07-30T00:00:00Z",
          "notes": "Xem danh sách tài liệu cần mang theo",
          "order": 4
        }
      ]
    },
    {
      "id": 6,
      "name": "Chuẩn bị đi",
      "order": 6,
      "items": [
        {
          "id": 601,
          "description": "Đặt vé máy bay",
          "is_completed": false,
          "due_date": "2024-08-10T00:00:00Z",
          "notes": "Nên đặt trước ít nhất 2 tháng để có giá tốt",
          "order": 1
        },
        {
          "id": 602,
          "description": "Bảo hiểm du học",
          "is_completed": false,
          "due_date": "2024-08-15T00:00:00Z",
          "notes": "Kiểm tra yêu cầu bảo hiểm của trường",
          "order": 2
        },
        {
          "id": 603,
          "description": "Tìm nhà ở",
          "is_completed": false,
          "due_date": "2024-08-01T00:00:00Z",
          "notes": "Ký túc xá hoặc thuê ngoài, liên hệ hội SV Việt Nam",
          "order": 3
        }
      ]
    }
  ]
};

export default mockChecklistData; 