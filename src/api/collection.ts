import React, { useEffect, useState} from 'react';

interface ICollectionMetadata 
{
    name:string,
    description?:string,
    image?:string,
    external_link?:string
}

const useCollectionMetadataApi = (apiPath:string, params?:string) => {

    /**
     * default data is empty and loading is true
     */
    const [data, setData] = useState<ICollectionMetadata>();
    const [isLoading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
        .then((res)=> res.json())
        .then((data)=> { 
            setData(data);
            setLoading(false);
        })
        .catch((error) => {
            console.error(`Error fetching from ${apiPath}:${error}`);
            setError(error);
        })
        .finally(() => {
            setLoading(false);
        });
    }, []); // run the effect only once

    return {data, isLoading, error};
};
export {useCollectionMetadataApi};
