import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FolderProvider } from "./context/FolderContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Folder from "./testpages/Folder";
import KakaoRedirectPage from "./pages/KakaoRedirectPage";
import Upload from "./testpages/Upload";
import Game from "./testpages/Game";
import FolderContents from "./testpages/FolderContents";
import FolderTree from "./testpages/FolderTree";
import ContextMenu from "./testpages/ContextMenu";

export default function App() {
  const rootFolderId = localStorage.getItem("rootFolderId");

  return (
    <FolderProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/home" element={<Navigate to={`/home/${rootFolderId}`} />} />
          <Route path="/home/:id" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/oauth/redirected/KAKAO"
            element={<KakaoRedirectPage />}
          />
          <Route path="/folder" element={<Folder />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/nonogram" element={<Game />} />
          <Route path="/foldercontents/" element={<FolderContents />} />
          <Route path="/foldercontents/:id" element={<FolderContents />} />
          <Route path="/foldertree" element={<FolderTree />} />
          <Route path="/contextmenu" element={<ContextMenu />} />
        </Routes>
      </BrowserRouter>
    </FolderProvider>
  );
}
