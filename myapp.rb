# myapp.rb
# クライアントのjavascriptから直接SPARQLエンドポイント叩けるようなら不要
# エラーハンドリングとかなんもやってない

require 'sinatra'
require 'net/http'
require 'uri'

logger = Logger.new('sinatra.log')

get '/' do
  send_file File.join(settings.public_folder, 'index.html')
end

get '/sparql' do
  query = URI.escape(params['query'])
  uri = URI.parse("http://data.yafjp.org/sparql?query=" + query + "&format=" + params['format'])

  result = Net::HTTP.get(uri)
  return result
end
