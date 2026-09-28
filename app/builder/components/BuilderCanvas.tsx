import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, { Background, Controls, MiniMap, addEdge, applyNodeChanges, applyEdgeChanges, Node, Edge, Connection, NodeChange, EdgeChange, ReactFlowInstance } from 'reactflow';
import { useRouter } from "next/navigation";
import { supabase } from "../../../src/lib/supabase";
import Sidebar from './Sidebar';
import SettingsPanel from './SettingsPanel';

const initialNodes: Node[] = [
  { id: 'start_node', type: 'input', position: { x: 250, y: 50 }, data: { label: 'Başlangıç' }, style: { backgroundColor: '#e0e7ff', border: '2px solid #4f46e5', borderRadius: '8px', fontWeight: 'bold' } }
];
let id = 1;
const getId = () => `soru_${id++}`;

export default function BuilderCanvas() {
  const router = useRouter();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/login");
    });
  }, [router]);

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    const label = event.dataTransfer.getData('application/label');
    if (!type || !reactFlowInstance) return;

    const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    
    // VAR OLAN ÖZELLİK: Çoklu seçimse varsayılan 2 seçenek ile oluştur
    const initialChoices = (type === 'checkbox' || type === 'radio') ? ["Seçenek 1", "Seçenek 2"] : [];
    
    // YENİ ÖZELLİK: Vinyet ise (senaryo) varyasyon dizisini başlat
    const initialVariations = type === 'vignette' ? [label] : undefined;

    const newNode: Node = {
      id: getId(),
      type: 'default',
      position,
      data: { 
        label, 
        questionType: type, 
        required: false, 
        choices: initialChoices,
        variations: initialVariations // Yeni özellik dataya eklendi
      },
      style: { backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', minWidth: '150px', padding: '10px' }
    };

    setNodes((nds) => nds.concat(newNode));
  }, [reactFlowInstance]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.id !== 'start_node') setSelectedNode(node);
  }, []);

  const updateNodeData = (key: string, value: any) => {
    if (!selectedNode) return;
    setNodes((nds) => nds.map((n) => {
      if (n.id === selectedNode.id) {
        const updatedNode = { ...n, data: { ...n.data, [key]: value } };
        setSelectedNode(updatedNode);
        return updatedNode;
      }
      return n;
    }));
  };

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
        title: nextNode.data.label,
        required: nextNode.data.required,
        choices: nextNode.data.choices,
        // YENİ: Vinyet varyasyonlarını veritabanına gönder
        variations: nextNode.data.variations 
      });
      currentNodeId = nextNode.id; 
    }

    const finalJSON = { title: "Anket Tasarımcısı", elements: elements };
    const { error } = await supabase.from('surveys').insert([{ title: finalJSON.title, survey_payload: finalJSON }]);
    setIsSaving(false);
    
    if (error) alert("Hata: " + error.message);
    else alert("Başarılı! Anket Supabase veritabanına kaydedildi.");
  };

  return (
    <div className="flex flex-row h-screen bg-gray-50 w-full overflow-hidden">
      <Sidebar />
      <div className="flex-1 h-full flex flex-col relative" ref={reactFlowWrapper}>
         <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6 justify-between shadow-sm z-10 w-full">
            <h1 className="text-xl font-bold text-gray-800">Anket Tasarımcısı</h1>
            <button onClick={saveSurveyToDatabase} disabled={isSaving} className={`px-4 py-2 text-white rounded-md font-medium transition ${isSaving ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
              {isSaving ? 'Kaydediliyor...' : 'Yayınla'}
            </button>
          </div>
        <ReactFlow
          nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
          onInit={setReactFlowInstance} onDrop={onDrop} onDragOver={onDragOver} onNodeClick={onNodeClick} onPaneClick={() => setSelectedNode(null)} fitView
        >
          <Background color="#ccc" gap={16} />
          <Controls />
          <MiniMap nodeStrokeColor="#4f46e5" nodeColor="#e0e7ff" />
        </ReactFlow>
      </div>
      {selectedNode && (
        <SettingsPanel selectedNode={selectedNode} updateNodeData={updateNodeData} closePanel={() => setSelectedNode(null)} />
      )}
    </div>
  );
}