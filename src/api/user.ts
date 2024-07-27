import React, { useEffect, useState} from 'react';
import {IUserWithAssetsInfo} from './interfaces';


const useActiveUserApi = (apiPath:string, params?:string) => {
   
    /**
     * default data is empty and loading is true
     */
    const [data, setData] = useState<IUserWithAssetsInfo>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const requestOptions = {
        method: 'GET', // POST, UPDATE, DELETE
        headers: {'Content-Type': 'application/json'}
        // body:
    };
    useEffect(()=> {
        /**
         * apiPath is relative, the routing is done by vit server (proxy config)
         * '/api': {
         *      target: 'http://localhost:3000',
         *  }
         * 
         * this routes the "api/**" relative path to "http://localhost:3000/api/**"
         * 
         */
        const getUrl = `${apiPath}`;
        fetch(getUrl, requestOptions)
        .then((res)=>  res.json())
        .then((data)=> { 
            setData(data);
            setLoading(false);
            setSuccess(true);
        })
        .catch((error) => {
            console.error(`Error fetching from ${getUrl}:${error}`);
            setError(error);
        })
        .finally(() => {
            setLoading(false);
        })
    }, [apiPath]); // run the effect if path changes

    return {data, loading, success, error};
};

export { useActiveUserApi};
