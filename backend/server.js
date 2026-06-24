require("dotenv").config();
const cors = require("cors");
const axios = require("axios");
const express = require("express");

const app = express();
app.use(cors());
app.use(express.json());

const mysql = require("mysql2");

// DB 연동
const db = mysql.createConnection({
  host: "localhost",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "music_app"
});

// 연결 확인
db.connect((err) => {
  if (err) {
    console.error("DB 연결 실패:", err);
  } else {
    console.log("MySQL 연결 성공!");
  }
});


const PORT = 3000;

// 기본 테스트 페이지
app.get("/", (req, res) => {
  res.send("Server running");
});

// 테스트 API
app.get("/api/test", (req, res) => {
  res.json({
    message: "테스트"
  });
});

// Spotify 토큰 발급 함수
async function getSpotifyToken() {
  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({
      grant_type: "client_credentials",
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.SPOTIFY_CLIENT_ID +
              ":" +
              process.env.SPOTIFY_CLIENT_SECRET
          ).toString("base64"),
      },
    }
  );

  return response.data.access_token;
}

// 토큰 테스트 API (발급 완료)
app.get("/token", async (req, res) => {
  try {
    const token = await getSpotifyToken();
    res.json({ access_token: token });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ message: "토큰 발급 실패" });
  }
});

// 검색 기능 (스포티파이 API로 부터 앨범정보를 가져온후 검색을하여 찾을수 있다)
app.get("/api/search", async (req, res) => {
  const query = req.query.query;

  if (!query) {
    return res.status(400).json({ message: "검색어를 입력해주세요." });
  }

  try {
    const token = await getSpotifyToken();

    const response = await axios.get("https://api.spotify.com/v1/search", {
      params: {
        q: query,
        type: "album",
        limit: 10
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const albums = response.data.albums.items.map((album) => {
  return {
    id: album.id,
    title: album.name,
    artist: album.artists.map((a) => a.name).join(", "),
    releaseDate: album.release_date,
    coverImage: album.images[0]?.url || null,
  };
});

res.json(albums);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ message: "앨범 검색 실패" });
  }
});

// 컬렉션 추가 API (앨범을 DB에 저장)
app.post("/api/collection", (req, res) => {
  const { id, title, artist, releaseDate, coverImage } = req.body;

  const sql = `
    INSERT INTO albums 
    (spotify_id, title, artist, release_date, cover_image, status)
    VALUES (?, ?, ?, ?, ?, 'WISH')
  `;

  db.query(
    sql,
    [id, title, artist, releaseDate, coverImage],
    (err, result) => {
      if (err) {
        console.error("DB 저장 실패:", err);
        return res.status(500).json({ message: "저장 실패" });
      }

      res.json({ message: "컬렉션에 추가됨!" });
    }
  );
});

// GET /api/collection - 저장된 컬렉션 조회 API
app.get("/api/collection", (req, res) => {
  const sql = "SELECT * FROM albums";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("DB 조회 실패:", err);
      return res.status(500).json({ message: "조회 실패" });
    }

    res.json(results);
  });
});

// PUT /api/collection/:id - 앨범 상태 변경 API
app.put("/api/collection/:id", (req, res) => {
  const id = req.params.id;
  const { status } = req.body;

  // 1. status 값 검증
  if (!["WISH", "OWNED"].includes(status)) {
    return res.status(400).json({ message: "유효하지 않은 상태값입니다." });
  }

  const sql = "UPDATE albums SET status = ? WHERE id = ?";

  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error("상태 변경 실패:", err);
      return res.status(500).json({ message: "상태 변경 실패" });
    }

    // 2. 존재하지 않는 id 체크
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "해당 앨범이 존재하지 않습니다." });
    }

    res.json({ message: "상태 변경 완료" });
  });
});


// DELETE /api/collection/:id - 앨범 삭제 API
app.delete("/api/collection/:id", (req, res) => {
  const id = req.params.id;

  const sql = "DELETE FROM albums WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("삭제 실패:", err);
      return res.status(500).json({ message: "삭제 실패" });
    }

    // 존재하지 않는 id 체크
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "해당 앨범이 존재하지 않습니다." });
    }

    res.json({ message: "삭제 완료" });
  });
});


// 서버 실행
app.listen(PORT, () => {
  console.log(`${PORT} 번 포트에서 서버 실행중`);
});