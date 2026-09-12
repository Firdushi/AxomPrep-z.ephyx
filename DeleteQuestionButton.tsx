'use client';
import { useState } from 'react';
export default function DeleteQuestionButton({id}:{id:string}){const [busy,setBusy]=useState(false);async function remove(){if(!confirm('Delete this question?'))return;setBusy(true);const r=await fetch(`/api/admin/questions/${id}`,{method:'DELETE'});if(r.ok)location.reload();else{setBusy(false);alert('Unable to delete question.')}}return <button className="btn btn-danger" onClick={remove} disabled={busy}>{busy?'Deleting…':'Delete'}</button>}
