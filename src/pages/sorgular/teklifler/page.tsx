import SorgularTemplate from "../SorgularTemplate";

export default function TekliflerSorgularPage() {
  // Gelecekteki farklı API buraya eklenecek, şimdilik mevcut API'yi devre dışı bıraktım.
  const handleCustomFetch = async () => {
    return []; // Yeni API entegre edilene kadar boş liste döner
  };

  return <SorgularTemplate subTab="offers" customFetch={handleCustomFetch} />;
}
