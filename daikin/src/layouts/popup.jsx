export default function Popup({ children }) {
  return (
    <div className="overflow-y-auto h-[calc(100vh-56px)]">
      {children}
    </div>
  )
}