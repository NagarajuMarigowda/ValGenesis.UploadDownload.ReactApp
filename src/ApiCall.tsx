
  export const InsertChuckData = async (payload: string | undefined): Promise<any[] | undefined> => {
    var datas;
    await fetch("https://localhost:7238/api/FileUpload/Create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    })
      .then((response) => response.json())
      .then((data) => {datas = data;})
      .catch((error) => console.error(error));
    return datas;
  };

  
  export const UpdateChuckData =async (payload: string | undefined): Promise<any[] | undefined> => {
    var datas;
    await fetch("https://localhost:7238/api/FileUpload/Update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: payload,
    })
      .then((response) => response.json())
      .then((data) => {datas = data;})
      .catch((error) => console.error(error));
      return datas;
  };

  export const CheckChuckData =async (payload: string | undefined): Promise<any[] | undefined> => {
    var datas;
    await fetch(`https://localhost:7238/api/FileUpload/Get?Id=${payload}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => response.json())
      .then((data) => {datas= data;})
      .catch((error) => console.error(error));
    return datas;
  };
  

  export const SetDate =(payload: Date): string => {
    const dateObj = new Date(payload); // convert to date object
    const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getFullYear()} ${dateObj.toLocaleTimeString()}`;
    return formattedDate;
  };