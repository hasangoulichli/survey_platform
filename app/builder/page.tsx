"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, { 
  ReactFlowProvider, 
  Background, 
  Controls, 
  MiniMap, 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges,
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
  ReactFlowInstance
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Type, Star, CheckSquare } from 'lucide-react';
import { useRouter } from "next/navigation";
import { supabase } from "../../src/lib/supabase"; 

const initialNodes: Node[] = [
  { 
    id: 'start_node', 
    type: 'input', 
    position: { x: 250, y: 50 }, 
    data: { label: 'Başlangıç' },
    style: { backgroundColor: '#e0e7ff', border: '2px solid #4f46e5', borderRadius: '8px', fontWeight: 'bold' }
  }
];

let id = 1;
const getId = () => `soru_${id++}`;

const Sidebar = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-3 shadow-sm z-20">
      <h3 className="font-semibold text-gray-700 mb-2 border-b pb-2">Soru Tipleri</h3>
      <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded cursor-grab hover:bg-gray-100 hover:border-indigo-300"
           onDragStart={(event) => onDragStart(event, 'rating', 'Puanlama (Rating)')} draggable>
        <Star size={18} className="text-indigo-600" />
        <span className="text-sm font-medium text-gray-700">Puanlama</span>
      </div>
      <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded cursor-grab hover:bg-gray-100 hover:border-indigo-300"
           onDragStart={(event) => onDragStart(event, 'text', 'Açık Metin')} draggable>
        <Type size={18} className="text-indigo-600" />
        <span className="text-sm font-medium text-gray-700">Açık Metin</span>
      </div>
      <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded cursor-grab hover:bg-gray-100 hover:border-indigo-300"
           onDragStart={(event) => onDragStart(event, 'checkbox', 'Çoklu Seçim')} draggable>
        <CheckSquare size={18} className="text-indigo-600" />
        <span className="text-sm font-medium text-gray-700">Çoklu Seçim</span>
      </div>
    </div>
  );
};

function BuilderCanvas() {
  const router = useRouter();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
      }
    });
  }, [router]);

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/label');

      if (!type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      
      const newNode: Node = {
        id: getId(),
        type: 'default',
        position,
        data: { label: `${label}`, questionType: type },
        style: { backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', minWidth: '150px', padding: '10px' }
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance]
  );

  const saveSurveyToDatabase = async () => {
    setIsSaving(true);
    const elements = [];
    let currentNodeId = 'start_node';

    while (currentNodeId) {
      const outgoingEdge = edges.find(e => e.source === currentNodeId);
      if (!outgoingEdge) break; 

      const nextNode = nodes.find(n => n.id === outgoingEdge.target);
      if (!nextNode) break;

      elements.push({
        name: nextNode.id,
        type: nextNode.data.questionType,
        title: nextNode.data.label
      });

      currentNodeId = nextNode.id; 
    }

    const finalJSON = {
      title: "KAPSA Araştırma Anketi",
      elements: elements
    };

    const { data, error } = await supabase
      .from('surveys')
      .insert([{ title: finalJSON.title, survey_payload: finalJSON }]);

    setIsSaving(false);

    if (error) {
      console.error("Kayıt Hatası:", error);
      alert("Hata: " + error.message);
    } else {
      alert("Başarılı! Anket Supabase veritabanına kaydedildi.");
    }
  };

  return (
    <div className="flex flex-row h-screen bg-gray-50 w-full overflow-hidden">
      <Sidebar />
      <div className="flex-1 h-full flex flex-col relative" ref={reactFlowWrapper}>
         <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6 justify-between shadow-sm z-10 w-full">
            <h1 className="text-xl font-bold text-gray-800">KAPSA Anket Tasarımcısı</h1>
            <button 
              onClick={saveSurveyToDatabase}
              disabled={isSaving}
              className={`px-4 py-2 text-white rounded-md font-medium transition ${isSaving ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {isSaving ? 'Kaydediliyor...' : 'Yayınla (Veritabanına Kaydet)'}
            </button>
          </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          fitView
        >
          <Background color="#ccc" gap={16} />
          <Controls />
          <MiniMap nodeStrokeColor="#4f46e5" nodeColor="#e0e7ff" />
        </ReactFlow>
      </div>
    </div>
  );
}

// YENİ EKLENEN KISIM: Sunucu derlemesini (SSR) atlatmak için kilit (isMounted)
export default function BuilderPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">Tasarımcı yükleniyor...</div>;
  }

  return (
    <ReactFlowProvider>
      <BuilderCanvas />
    </ReactFlowProvider>
  );
}