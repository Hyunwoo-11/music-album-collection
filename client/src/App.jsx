import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [albums, setAlbums] = useState([]);
  const [myCollection, setMyCollection] = useState([]);
  const [view, setView] = useState("home");
  const [collectionQuery, setCollectionQuery] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      const response = await axios.get("http://localhost:3000/api/search", {
        params: { query },
      });

      setAlbums(response.data);
      setMyCollection([]);
      setView("search");
    } catch (error) {
      console.error("검색 실패:", error);
    }
  };

  const addToCollection = async (album) => {
    try {
      await axios.post("http://localhost:3000/api/collection", album);
      alert("컬렉션에 추가됨!");
    } catch (error) {
      console.error("저장 실패:", error);
    }
  };

  const getMyCollection = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/collection");
      setMyCollection(response.data);
      setAlbums([]);
      setView("collection");
    } catch (error) {
      console.error("컬렉션 조회 실패:", error);
    }
  };

  const updateStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "WISH" ? "OWNED" : "WISH";

    try {
      await axios.put(`http://localhost:3000/api/collection/${id}`, {
        status: newStatus,
      });

      alert("상태 변경 완료!");
      getMyCollection();
    } catch (error) {
      console.error("상태 변경 실패:", error);
    }
  };

  const deleteAlbum = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/collection/${id}`);
      alert("삭제 완료!");
      getMyCollection();
    } catch (error) {
      console.error("삭제 실패:", error);
    }
  };

  const filteredCollection = myCollection.filter((album) =>
    album.title.toLowerCase().includes(collectionQuery.toLowerCase()) ||
    album.artist.toLowerCase().includes(collectionQuery.toLowerCase())
  );

  return (
    <div className="app">
      <h1 className="title">Music Album Collection</h1>

      {view === "home" && (
        <div className="home-menu">
          <button className="main-btn" onClick={() => setView("search")}>
            앨범 검색하기
          </button>
          <button className="main-btn secondary" onClick={getMyCollection}>
            내 컬렉션 보기
          </button>
        </div>
      )}

      {view === "search" && (
        <>
          <div className="top-bar">
            <input
              className="search-input"
              type="text"
              placeholder="가수나 앨범 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <button className="main-btn" onClick={handleSearch}>
              검색
            </button>

            <button className="main-btn secondary" onClick={() => setView("home")}>
              홈으로
            </button>
          </div>

          <div className="card-grid">
            {albums.map((album) => (
              <div className="album-card" key={album.id}>
                <img
                  className="album-image"
                  src={album.coverImage}
                  alt={album.title}
                />
                <p className="album-title">{album.title}</p>
                <p className="album-text">{album.artist}</p>
                <p className="album-text">{album.releaseDate}</p>

                <button
                  className="main-btn small-btn"
                  onClick={() => addToCollection(album)}
                >
                  내 컬렉션 추가
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {view === "collection" && (
        <>
          <div className="top-bar">
            <button className="main-btn secondary" onClick={() => setView("home")}>
              홈으로
            </button>

            <input
              className="search-input"
              type="text"
              placeholder="내 컬렉션 검색"
              value={collectionQuery}
              onChange={(e) => setCollectionQuery(e.target.value)}
            />
          </div>

          {myCollection.length > 0 && (
            <>
              <h2 className="section-title">내 컬렉션</h2>

              <div className="card-grid">
                {filteredCollection.map((album) => (
                  <div className="album-card" key={album.id}>
                    <img
                      className="album-image"
                      src={album.cover_image}
                      alt={album.title}
                    />
                    <p className="album-title">{album.title}</p>
                    <p className="album-text">{album.artist}</p>
                    <p className="album-text">{album.release_date}</p>
                    <p
                      className={
                        album.status === "WISH" ? "status wish" : "status owned"
                      }
                    >
                      {album.status}
                    </p>

                    <div className="button-group">
                      <button
                        className="main-btn small-btn"
                        onClick={() => updateStatus(album.id, album.status)}
                      >
                        상태 변경
                      </button>

                      <button
                        className="main-btn delete-btn small-btn"
                        onClick={() => deleteAlbum(album.id)}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;