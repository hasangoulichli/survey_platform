import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, { Background, Controls, MiniMap, addEdge, applyNodeChanges, applyEdgeChanges, Node, Edge, Connection, NodeChange, EdgeChange, ReactFlowInstance } from 'reactflow';
import { useRouter } from "next/navigation";
import { supabase } from "../../../src/lib/supabase";
import Sidebar from './Sidebar';
import SettingsPanel from './SettingsPanel';

const initialNodes: Node[] = [
  { id: 'start_node', type: 'input', position: { x: 250, y: 50 }, data: { label: 'Başlangıç' }, style: { backgroundColor: '#e0e7ff', border: '2px solid #4f46e5', borderRadius: '8px', fontWeight: 'bold' } }
];

let idCounter = 1;
const getId = () => `soru_${idCounter++}`;

type BuilderCanvasProps = {
  editId?: string;
};

export default function BuilderCanvas({ editId }: BuilderCanvasProps) {
  const router = useRouter();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [surveyTitle, setSurveyTitle] = useState(`Araştırma Anketi - ${new Date().toLocaleDateString('tr-TR')}`);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // 1. GİRİŞ KONTROLÜ VE DÜZENLEME (EDIT) VERİSİNİ ÇEKME
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
      } else if (editId) {
        loadSurveyForEditing(editId);
      }
    });
  }, [router, editId]);

  // 2. DÜZENLEME İÇİN VERİLERİ (RAW NODES) GERİ YÜKLEME
  const loadSurveyForEditing = async (surveyId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.from('surveys').select('*').eq('id', surveyId).single();
    
    if (error || !data) {
      alert("Anket yüklenemedi!");
      setIsLoading(false);
      return;
    }

    setSurveyTitle(data.title);
    
    // Geçmişte kendi bulduğunuz harika fikir: raw_nodes'u ekrana basıyoruz
    if (data.survey_payload && data.survey_payload.raw_nodes && data.survey_payload.raw_edges) {
      idCounter = data.survey_payload.raw_nodes.length + 1;
      setNodes(data.survey_payload.raw_nodes);
      setEdges(data.survey_payload.raw_edges);
    } else {
      alert("Bu anket eski sistemle kaydedilmiş, kutular yüklenemiyor.");
    }

    setTimeout(() => {
        if(reactFlowInstance) reactFlowInstance.fitView();
    }, 100);

    setIsLoading(false);
  };

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    const defaultLabel = event.dataTransfer.getData('application/label');
    if (!type || !reactFlowInstance) return;

    const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    
    // SEÇENEKLERİ BOŞ BAŞLAT
    const initialChoices = (type === 'checkbox' || type === 'radio') ? ["", ""] : [];
    const initialVariations = type === 'vignette' ? [""] : undefined;

    const newNode: Node = {
      id: getId(),
      type: 'default',
      position,
      data: { 
        label: "", // Kutular boş gelir
        questionType: type, 
        required: false, 
        choices: initialChoices,
        variations: initialVariations,
        blockTitle: defaultLabel 
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

  // 3. DOĞRU KAYDETME FONKSİYONU (UPDATE/INSERT & RAW_NODES)
  const saveSurveyToDatabase = async (publish: boolean) => {
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
        variations: nextNode.data.variations,
      });
      currentNodeId = nextNode.id;
    }

    // JSON PAKETİ (Supabase'deki survey_payload sütununa gidecek)
    const finalJSON = { 
      title: surveyTitle, 
      elements: elements,
      raw_nodes: nodes,   // Düzenleme ekranı için
      raw_edges: edges    // Düzenleme ekranı için
    };

    try {
      let responseError = null;

      if (editId) {
        // GÜNCELLEME (UPDATE)
        const { error } = await supabase.from('surveys').update({
          title: surveyTitle,
          survey_payload: finalJSON,
          is_active: publish
        }).eq('id', editId);
        responseError = error;
      } else {
        // YENİ KAYIT (INSERT)
        const { error } = await supabase.from('surveys').insert([{
          title: surveyTitle,
          survey_payload: finalJSON,
          is_active: publish
        }]);
        responseError = error;
      }

      if (responseError) throw responseError;
      
      alert(editId ? `Başarılı! Anketiniz güncellendi ve ${publish ? 'yayınlandı' : 'taslak olarak kaydedildi'}.` : `Başarılı! Anket oluşturuldu ve ${publish ? 'yayınlandı' : 'taslak olarak kaydedildi'}.`);
      router.push('/dashboard');
      
    } catch (error: any) {
      console.error('Anket kaydedilemedi:', error);
      alert("Hata: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">Anket verileri yükleniyor...</div>;

  return (
    <div className="flex flex-row h-screen bg-gray-50 w-full overflow-hidden">
      <Sidebar />
      <div className="flex-1 h-full flex flex-col relative" ref={reactFlowWrapper}>
         <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6 justify-between shadow-sm z-10 w-full">
            <input 
              type="text" 
              value={surveyTitle}
              onChange={(e) => setSurveyTitle(e.target.value)}
              className="text-xl font-bold text-gray-800 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none px-2 py-1 transition-colors w-1/2"
              placeholder="Araştırma Başlığını Giriniz..."
            />
            <div className="flex gap-3">
                <button 
                    onClick={() => saveSurveyToDatabase(false)} 
                    disabled={isSaving} 
                    className={`px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium transition hover:bg-gray-50 disabled:opacity-50`}
                >
                    Taslağı Kaydet
                </button>
                <button 
                    onClick={() => saveSurveyToDatabase(true)} 
                    disabled={isSaving} 
                    className={`px-4 py-2 text-white rounded-md font-medium transition ${isSaving ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                    {editId ? 'Güncelle ve Yayınla' : 'Yayınla'}
                </button>
            </div>
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