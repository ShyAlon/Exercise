#
for ((i=1; i<=10; i++))
do
    node index.js $i 200 &
done

wait