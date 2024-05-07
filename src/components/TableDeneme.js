import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { useState } from 'react';

const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'eslesmeDurumu', headerName: 'Eşleşme Durumu', width: 130 },
    { field: 'makineNo', headerName: 'Makine No', width: 130 },
    {
        field: 'refNo',
        headerName: 'Referans No',
        type: 'number',
        width: 90,
    },
    {
        field: 'miktar',
        headerName: 'Miktar',
        type: 'number',
        width: 90,
    },
    {
        field: 'hataTipi',
        headerName: 'Hata Tipi',
        type: 'number',
        width: 90,
    },
    {
        field: 'tarih',
        headerName: 'Tarih',
        type: 'number',
        width: 90,
    },
    {
        field: 'etiketNo',
        headerName: 'Etiket No',
        description: 'This column has a value getter and is not sortable.',
        sortable: false,
        width: 160,
        // valueGetter: (params) =>
        //     `${params.row.firstName || ''} ${params.row.lastName || ''}`,
    },
];

const rows = [
    { id: 1, lastName: 'Snow', firstName: 'Jon', age: 35 },
    { id: 2, lastName: 'Lannister', firstName: 'Cersei', age: 42 },
    { id: 3, lastName: 'Lannister', firstName: 'Jaime', age: 45 },
    { id: 4, lastName: 'Stark', firstName: 'Arya', age: 16 },
    { id: 5, lastName: 'Targaryen', firstName: 'Daenerys', age: null },
    { id: 6, lastName: 'Melisandre', firstName: null, age: 150 },
    { id: 7, lastName: 'Clifford', firstName: 'Ferrara', age: 44 },
    { id: 8, lastName: 'Frances', firstName: 'Rossini', age: 36 },
    { id: 9, lastName: 'Roxie', firstName: 'Harvey', age: 65 },
];

export default function TableDeneme() {
    // const [rows, setRows] = useState([])
    return (
        <div style={{ height: 400, width: '80%' }}>
            <DataGrid
                rows={rows}
                columns={columns}
                initialState={{
                    pagination: {
                        paginationModel: { page: 0, pageSize: 5 },
                    },
                }}
                pageSizeOptions={[5, 10]}
                checkboxSelection
            />
        </div>
    );
}
