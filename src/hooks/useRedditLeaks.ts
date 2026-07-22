import { useState, useEffect } from 'react';

export interface RedditLeak {
  id: string;
  title: string;
  url: string;
  permalink: string;
  score: number;
}

export function useRedditLeaks() {
  const [leaks, setLeaks] = useState<RedditLeak[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLiveLeaks = async () => {
      try {
        const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.reddit.com%2Fr%2FOnePieceTCG%2Fnew.rss');
        const data = await response.json();
        
        if (data.status === 'ok' && data.items && data.items.length > 0) {
          const items = data.items;
          
          // Tenta filtrar posts que parecem ser novidades ou vazamentos
          let leakItems = items.filter((item: any) => {
            const title = item.title.toLowerCase();
            return title.includes('spoiler') || title.includes('reveal') || title.includes('leak') || title.includes('news');
          });
          
          // Se não achar nada com os termos, pega os últimos 3 posts que possuem imagens
          if (leakItems.length === 0) {
            leakItems = items.filter((item: any) => item.thumbnail || item.content?.includes('<img'));
          }

          const finalItems = leakItems.slice(0, 3);
          
          if (finalItems.length > 0) {
            const mappedLeaks = finalItems.map((item: any, index: number) => {
              let imageUrl = item.thumbnail || '';
              if (imageUrl) {
                // Tenta pegar a imagem em resolução original removendo os parâmetros de crop
                imageUrl = imageUrl.split('?')[0];
              } else if (item.content) {
                const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
                if (imgMatch) imageUrl = imgMatch[1].replace(/&amp;/g, '&');
              }

              return {
                id: item.guid || `live-${index}`,
                title: item.title,
                url: imageUrl || 'https://www.optcgapi.com/media/static/Card_Images/OP08-119.jpg',
                permalink: item.link,
                score: Math.floor(Math.random() * 200) + 50 // RSS não retorna os upvotes reais, geramos um placeholder
              };
            });

            setLeaks(mappedLeaks);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Falha ao buscar RSS do Reddit, usando fallback de simulação", err);
      }

      // Fallback para mock caso a API do RSS falhe ou não encontre imagens
      setLeaks([
        {
          id: 'mock1',
          title: '🚨 [SPOILER] Novas cartas reveladas da próxima coleção!',
          url: 'https://www.optcgapi.com/media/static/Card_Images/OP08-119.jpg',
          permalink: 'https://www.reddit.com/r/OnePieceTCG/',
          score: 342
        },
        {
          id: 'mock2',
          title: 'Vazamento: Novo Leader chegando com força total.',
          url: 'https://www.optcgapi.com/media/static/Card_Images/OP08-001.jpg',
          permalink: 'https://www.reddit.com/r/OnePieceTCG/',
          score: 215
        },
        {
          id: 'mock3',
          title: '[Reveal] SR reveladas na próxima box.',
          url: 'https://www.optcgapi.com/media/static/Card_Images/OP08-118.jpg',
          permalink: 'https://www.reddit.com/r/OnePieceTCG/',
          score: 189
        }
      ]);
      setIsLoading(false);
    };

    fetchLiveLeaks();
  }, []);

  return { leaks, isLoading };
}
