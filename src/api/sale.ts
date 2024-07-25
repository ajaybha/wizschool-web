import React, { useEffect, useState} from 'react';

const useSalesApi = (baseUrl:string, apiPath:string, params?:string) => {

    const getUrl = `${baseUrl}/${apiPath}`;
    /**
     * default data is empty and loading is true
     */
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const requestOptions = {
        method: 'GET', // POST, UPDATE, DELETE
        headers: {'Content-Type': 'application/json'}
        // body:
    };
    useEffect(()=> {
        fetch(getUrl, requestOptions)
        .then((res)=>  res.json())
        .then((data)=> { 
            setData(data);
            setLoading(false);
        })
        .catch((error) => {
            console.error(`Error fetching from ${getUrl}:${error}`);
            setError(error);
        })
        .finally(() => {
            setLoading(false);
        })
    }, [baseUrl, apiPath]);

    return {data, loading, error};
};
export {useSalesApi};
