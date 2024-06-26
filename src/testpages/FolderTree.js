import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FolderContext } from "../context/FolderContext";
import styles from "../styles/foldertree.module.css";
import { moveFile } from "../api/file";
import { fetchFolderData, moveFolder } from "../api/folder";

export default function FolderTree() {
  const [toggleStatus, setToggleStatus] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const { folderTree, setFolderTree, setTopFolderName, topFolderName, renameFolderInfo, checkedFiles, setMovedFileList, setMovedFolderInfo, movedFolderInfo } = useContext(FolderContext);
  const navigate = useNavigate();
  const { id } = useParams();

  const rootFolderId = localStorage.getItem("rootFolderId");
  const isRootDraggedOver = dragOverId === rootFolderId;
  
  useEffect(() => {
    if (folderTree) {
      const openAllFolders = (folders, status = {}) => {
        folders.forEach((folder) => {
          if (folder.type === "folder") {
            status[folder.id] = true;
            if (folder.children) {
              openAllFolders(folder.children, status);
            }
          }
        });
        return status;
      };

      const initialToggleStatus = openAllFolders(folderTree);
      setToggleStatus(initialToggleStatus);
      fetchFolderData(rootFolderId);
    }
  }, [folderTree, renameFolderInfo, movedFolderInfo, movedFolderInfo, rootFolderId]);

  const handleToggle = (id) => {
    setToggleStatus((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  const handleSelect = (id, name) => {
    setSelectedId(id);
    setTopFolderName(name);
    console.log(topFolderName);
    navigate(`/home/${id}`);
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    setDragOverId(id);
  };

  const handleDragLeave = (id) => {
    setDragOverId(null);
  };

  const handleDrop = async (e, id) => {
    e.preventDefault();
    setDragOverId(null);

    const draggedFileId = e.dataTransfer.getData("text/plain");
    const draggedFolderId = e.dataTransfer.getData("folder/plain");

    // 이미지 드롭 처리 로직 추가

    if (draggedFileId) {
      await moveFile(draggedFileId, id); // 체크 표시 안 한 파일 이동
      setMovedFileList((prevList) => [...prevList, draggedFileId]);
    }

    const movedFiles = [];
    if (checkedFiles) {
      for (const fileId of checkedFiles) { // 여러 개의 파일 이동
        await moveFile(fileId, id);
        movedFiles.push(fileId);
        console.log(`Dropped file id: ${draggedFileId} on folder id: ${id}`);
      }
      setMovedFileList((prevList) => [...prevList, ...movedFiles]);
    }

    if (draggedFolderId) {
      await moveFolder(draggedFolderId, id);
      console.log(`Dropped folder id: ${draggedFolderId} on folder id: ${id}`);
      setMovedFolderInfo((prevList) => [...prevList, ...draggedFolderId]);
    }
  };

  const RecursiveComp = ({ rowData, depth }) => {
    const paddingLeft = 10 + depth * 17;
    const isDraggedOver = dragOverId === rowData.id;

    return (
      <>
        <div
          style={{ paddingLeft }}
          onClick={() => {
            handleSelect(rowData.id, rowData.name);
          }}
          onDragOver={(e) => handleDragOver(e, rowData.id)}
          onDragLeave={() => handleDragLeave(rowData.id)}
          onDrop={(e) => handleDrop(e, rowData.id)}

          className={`${styles.folderItem} ${
            id === rowData.id ? styles.selected : ""
          } ${isDraggedOver ? styles.dragOver : ""}`}
        >
          <div
            className={styles.toggleHash}
            onClick={(e) => {
              e.stopPropagation();
              handleToggle(rowData.id);
            }}
          >
            <span className={styles.arrow}>#</span>
          </div>
          <div className={styles.folderName}>{rowData.name}</div>
        </div>
        {rowData.type === "folder" &&
          toggleStatus[rowData.id] &&
          rowData.children.map((v) => (
            <RecursiveComp key={v.id} rowData={v} depth={depth + 1} />
          ))}
      </>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.treeZone}>
        {Array.isArray(folderTree) ? (
          folderTree.map((child) => (
            <RecursiveComp key={child.id} rowData={child} depth={0} />
          ))
        ) : (
          <p className={styles.loadingText}>Loading folder structure...</p>
        )}
        <div className={styles.divisionLine}>
          <div style={{ backgroundColor: "#ddd" }} className={styles.line} />
          <div style={{ backgroundColor: "#bbb" }} className={styles.line} />
          <div style={{ backgroundColor: "#999" }} className={styles.line} />
          <div style={{ backgroundColor: "#fff" }} className={styles.line} />
        </div>
        <div
          onClick={() => {
            handleSelect(rootFolderId, "Sunha's folder list");
          }}
          onDragOver={(e) => handleDragOver(e, rootFolderId)}
          onDragLeave={() => handleDragLeave(rootFolderId)}
          onDrop={(e) => handleDrop(e, rootFolderId)}
          className={`${styles.userRoot} ${
            id === rootFolderId ? styles.userRootSelected : ""
          } ${isRootDraggedOver ? styles.dragOver : ""}`}
        >
          <object
            type="image/svg+xml"
            data="/assets/images/osface.svg"
            className={styles.faceIcon}
          >
            <img src="/assets/images/osface.svg" alt="Face Icon" />
          </object>
          <div className={styles.userText}>Sunha's folder list</div>
        </div>
      </div>
    </div>
  );
}
