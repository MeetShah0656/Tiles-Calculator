
'use client';
import { useState } from 'react';

export default function Home() {
  const [rows, setRows] = useState([{length:'', width:'', qty:1}]);

  const roundFt = (inches) => Math.ceil((Number(inches)/12) * 4) / 4;

  const updateRow = (i, field, value) => {
    const r=[...rows];
    r[i][field]=value;
    setRows(r);
  };

  const addRow = () => setRows([...rows,{length:'',width:'',qty:1}]);

  const duplicateRow = (i) => setRows([...rows, {...rows[i]}]);

  const removeRow = (i) => setRows(rows.filter((_,idx)=>idx!==i));

  let totalArea = 0;
  let totalQty = 0;

  return (
    <main style={{padding:20,fontFamily:'Arial'}}>
      <h1>Tile Business Calculator</h1>
      <p>Inches → Feet → Round UP to next 0.25 ft → Area</p>

      <table border="1" cellPadding="8" style={{borderCollapse:'collapse', width:'100%'}}>
        <thead>
          <tr>
            <th>Length (in)</th>
            <th>Width (in)</th>
            <th>Qty</th>
            <th>Area/Piece</th>
            <th>Total Area</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
        {rows.map((row,i)=>{
          let areaPiece=0,total=0;
          if(row.length && row.width){
            const l=roundFt(row.length);
            const w=roundFt(row.width);
            areaPiece=l*w;
            total=areaPiece*Number(row.qty||1);
            totalArea += total;
            totalQty += Number(row.qty||1);
          }
          return (
            <tr key={i}>
              <td><input value={row.length} onChange={e=>updateRow(i,'length',e.target.value)} /></td>
              <td><input value={row.width} onChange={e=>updateRow(i,'width',e.target.value)} /></td>
              <td><input type="number" value={row.qty} onChange={e=>updateRow(i,'qty',e.target.value)} /></td>
              <td>{areaPiece.toFixed(2)}</td>
              <td>{total.toFixed(2)}</td>
              <td>
                <button onClick={()=>duplicateRow(i)}>Duplicate</button>
                <button onClick={()=>removeRow(i)}>Delete</button>
              </td>
            </tr>
          )
        })}
        </tbody>
      </table>

      <br/>
      <button onClick={addRow}>Add Row</button>

      <h2>Summary</h2>
      <p>Total Quantity: {totalQty}</p>
      <p>Total Area: {totalArea.toFixed(2)} sq ft</p>
    </main>
  );
  }
