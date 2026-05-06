export default function GenericPage({
  title,
  description,
  icon = "📄",
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Top Section */}
        <div className="p-10 border-b border-slate-200">
          <div className="flex items-center gap-6">
            
            {/* Icon */}
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-5xl shadow-lg">
              {icon}
            </div>

            {/* Title */}
            <div>
              <h1 className="text-4xl font-bold text-slate-800">
                {title}
              </h1>

              {description && (
                <p className="mt-3 text-slate-500 text-lg leading-relaxed max-w-2xl">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-12">
          <div className="border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50 py-20 px-8 text-center">

            <div className="text-7xl mb-6 animate-bounce">
              🚀
            </div>

            <h2 className="text-3xl font-bold text-slate-800">
              Module Under Development
            </h2>

            <p className="mt-5 text-slate-500 text-lg leading-8 max-w-2xl mx-auto">
              This page is currently under construction.
              Replace this placeholder with your real business dashboard,
              analytics, forms, reports, or workflows.
            </p>

            {/* Buttons */}
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <button className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg transition-all duration-200">
                Continue
              </button>

              <button className="px-6 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition-all duration-200">
                Learn More
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
} 