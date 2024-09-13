export default function Page({ params }: { params: { gameId: string } }) {
    return <div>Code Names Game ID: {params.gameId}</div>
  }