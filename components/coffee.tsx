import {useEffect, useState} from "react";

export const Coffee = () => {
    const [data, setData] = useState("");
    const getData = async () => {
        try {
            const resp = await fetch('https://api.sampleapis.com/coffee/hot');
            const json = await resp.json();
            setData(json);
        } catch (err) {
            setData(err as string);
        }
    }

    useEffect(() => {
        getData();
    }, []);

    return (
        <pre>
          {JSON.stringify(data, null, 2)}
        </pre>
    )
};

export default Coffee;