import axios from "axios";
// 폴더 생성
export const createFolder = async (folderName, userId, parentId) => {
  try {
    const response = await fetch(
      'http://3.38.95.127:8080/folder/create',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderName: folderName,
          userId: userId,
          parentId: parentId,
        }),
      }
    );

    if (response.ok) {
      const newFolderId = await response.json();
      console.log(newFolderId);
      return newFolderId;
    } else {
      console.error("Error creating folder:", response.statusText);
    }
  } catch (error) {
    console.error("Error creating folder:", error);
  }
};

// 폴더 휴지통 이동
export const handleFolderToTrash = async (folderId) => {
  try {
    const response = await fetch(
      `http://3.38.95.127:8080/folder/trash/${folderId}`,
      {
        method: "PATCH",
        headers: {},
      }
    );

    if (response.ok) {
      console.log("Folder moved to trash successfully.");
    } else {
      console.error("Error moving folder to trash:", response.statusText);
    }
  } catch (error) {
    console.error("Error moving folder to trash:", error);
  }
};

// 폴더 내 하위 폴더 조회
export const fetchFolderData = async (id) => {
  try {
    const response = await fetch(
      `http://3.38.95.127:8080/folder/child/folder/${id}`
    );
    const data = await response.json();
    console.log("Folder", data.folders);
    return data.folders;
  } catch (error) {
    console.error("Error fetching folder data:", error);
  }
};

// 폴더 이동
export const moveFolder = async(draggedFolderId, droppedFolderId) => {
  try {
    const response = await axios.patch(`http://3.38.95.127:8080/folder/move/${draggedFolderId}/${droppedFolderId}`, {}, {
      headers: {
        'accept': '*/*'
      }
    });
  } catch (error) {
    console.error('API Error:', error);
  }

}